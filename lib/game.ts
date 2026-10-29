import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import type { PoolClient } from "pg";
import { db, transaction } from "./db";
import { canBet, ensure, normalizeCode, payout } from "./rules";
import type { Option, Round, Snapshot } from "./types";
export const roundSchema = z
  .object({
    question: z.string().trim().min(5).max(240),
    options: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(120),
          odds: z.number().int().min(110).max(2000).multipleOf(10),
        }),
      )
      .min(2)
      .max(4),
    correct: z.number().int().min(0).max(3),
    explanation: z.string().trim().max(600).default(""),
    duration: z.number().int().min(15).max(300).default(45),
  })
  .refine((r) => r.correct < r.options.length, "Die richtige Antwort fehlt.");
export type RoundInput = z.infer<typeof roundSchema>;
const examples: RoundInput[] = [
  {
    question: "Wie viele Minuten hat ein Tag?",
    options: [
      { label: "720 Minuten", odds: 400 },
      { label: "1’440 Minuten", odds: 200 },
      { label: "2’880 Minuten", odds: 300 },
    ],
    correct: 1,
    explanation: "24 Stunden × 60 Minuten = 1’440 Minuten.",
    duration: 45,
  },
  {
    question: "Welche Farbe entsteht, wenn man blaue und gelbe Farbe mischt?",
    options: [
      { label: "Grün", odds: 250 },
      { label: "Violett", odds: 500 },
      { label: "Orange", odds: 300 },
    ],
    correct: 0,
    explanation: "Beim Mischen von blauer und gelber Malfarbe entsteht Grün.",
    duration: 45,
  },
  {
    question: "Welcher Planet ist der Sonne am nächsten?",
    options: [
      { label: "Venus", odds: 400 },
      { label: "Merkur", odds: 200 },
      { label: "Mars", odds: 350 },
    ],
    correct: 1,
    explanation: "Merkur ist der innerste Planet unseres Sonnensystems.",
    duration: 45,
  },
];
async function lockedGame(client: PoolClient, code: string) {
  const result = await client.query(
    "SELECT * FROM games WHERE code=$1 FOR UPDATE",
    [normalizeCode(code)],
  );
  ensure(result.rows[0], "Spiel nicht gefunden.", 404);
  return result.rows[0];
}
async function addRound(client: PoolClient, gameId: string, data: RoundInput) {
  const { rows } = await client.query(
    "SELECT COALESCE(MAX(position),0)+1 AS next FROM rounds WHERE game_id=$1",
    [gameId],
  );
  await client.query(
    "INSERT INTO rounds(id,game_id,position,question,options,correct,explanation,duration) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      randomUUID(),
      gameId,
      rows[0].next,
      data.question,
      JSON.stringify(data.options),
      data.correct,
      data.explanation,
      data.duration,
    ],
  );
}
export async function createGame(
  title: string,
  demo: boolean,
  ownerHash: string,
) {
  ensure(/^[a-f0-9]{64}$/.test(ownerHash), "Spiel-Identität fehlt.", 401);
  return transaction(async (client) => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    // ON CONFLICT keeps the transaction usable in the unlikely event of a code collision.
    let code = "";
    let id = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      code = Array.from(
        { length: 6 },
        () => alphabet[randomInt(alphabet.length)],
      ).join("");
      id = randomUUID();
      const result = await client.query(
        "INSERT INTO games(id,code,title,owner_hash) VALUES($1,$2,$3,$4) ON CONFLICT(code) DO NOTHING",
        [id, code, title, ownerHash],
      );
      if (result.rowCount) break;
      ensure(
        attempt < 9,
        "Code konnte nicht erstellt werden. Bitte erneut versuchen.",
        503,
      );
    }
    if (demo) for (const data of examples) await addRound(client, id, data);
    return { code };
  });
}
export async function listGames(ownerHash: string | null) {
  if (!ownerHash) return [];
  return (
    await db().query(
      "SELECT code,title,status,created_at FROM games WHERE owner_hash=$1 ORDER BY created_at DESC LIMIT 50",
      [ownerHash],
    )
  ).rows;
}
export async function joinGame(
  code: string,
  name: string,
  tokenHash: string,
  existingHash: string | null,
  avatar = "fox",
) {
  return transaction(async (client) => {
    const game = await lockedGame(client, code);
    if (existingHash) {
      const existing = await client.query(
        "SELECT id FROM players WHERE game_id=$1 AND token_hash=$2",
        [game.id, existingHash],
      );
      if (existing.rowCount) return { resumed: true };
    }
    ensure(game.status !== "finished", "Dieses Spiel ist beendet.");
    const count = await client.query(
      "SELECT COUNT(*)::int AS n FROM players WHERE game_id=$1",
      [game.id],
    );
    ensure(count.rows[0].n < 300, "Die Session ist voll.");
    const duplicate = await client.query(
      "SELECT id FROM players WHERE game_id=$1 AND lower(name)=lower($2)",
      [game.id, name],
    );
    ensure(!duplicate.rowCount, "Dieser Name ist schon vergeben.");
    await client.query(
      "INSERT INTO players(id,game_id,name,token_hash,avatar) VALUES($1,$2,$3,$4,$5)",
      [randomUUID(), game.id, name, tokenHash, avatar],
    );
    return { resumed: false };
  });
}
export async function placeBet(
  code: string,
  tokenHash: string | null,
  option: number,
  stake: number,
) {
  return transaction(async (client) => {
    const game = await lockedGame(client, code);
    ensure(game.status === "playing", "Aktuell sind keine Wetten offen.");
    const round = (
      await client.query(
        "SELECT *, clock_timestamp() AS db_now FROM rounds WHERE id=$1 AND game_id=$2",
        [game.active_round_id, game.id],
      )
    ).rows[0];
    ensure(
      round &&
        canBet(round.status, round.closes_at, new Date(round.db_now).getTime()),
      "Die Wette ist geschlossen.",
    );
    ensure(
      Number.isInteger(option) && option >= 0 && option < round.options.length,
      "Ungültige Antwort.",
    );
    const player = (
      await client.query(
        "SELECT * FROM players WHERE game_id=$1 AND token_hash=$2",
        [game.id, tokenHash],
      )
    ).rows[0];
    ensure(player, "Bitte zuerst teilnehmen.", 401);
    const existing = await client.query(
      "SELECT id FROM bets WHERE round_id=$1 AND player_id=$2",
      [round.id, player.id],
    );
    ensure(!existing.rowCount, "Dein Einsatz ist bereits gespeichert.");
    ensure(
      Number.isSafeInteger(stake) && stake >= 1 && stake <= player.balance,
      "Nicht genügend Coins oder ungültiger Einsatz.",
    );
    await client.query(
      "INSERT INTO bets(id,round_id,player_id,option_index,stake,all_in) VALUES($1,$2,$3,$4,$5,$6)",
      [
        randomUUID(),
        round.id,
        player.id,
        option,
        stake,
        stake === player.balance,
      ],
    );
    await client.query("UPDATE players SET balance=balance-$1 WHERE id=$2", [
      stake,
      player.id,
    ]);
    return { ok: true };
  });
}
export async function bailout(code: string, tokenHash: string | null) {
  return transaction(async (client) => {
    const game = await lockedGame(client, code);
    ensure(game.status !== "finished", "Dieses Spiel ist beendet.");
    const player = (
      await client.query(
        "SELECT * FROM players WHERE game_id=$1 AND token_hash=$2",
        [game.id, tokenHash],
      )
    ).rows[0];
    ensure(player, "Bitte zuerst teilnehmen.", 401);
    ensure(
      player.balance === 0 && !player.bailout_used,
      "Bailout ist nur einmal bei 0 Coins möglich.",
    );
    const pending = await client.query(
      "SELECT id FROM bets WHERE player_id=$1 AND payout IS NULL",
      [player.id],
    );
    ensure(!pending.rowCount, "Warte zuerst auf die Auflösung deiner Wette.");
    await client.query(
      "UPDATE players SET balance=300,bailout_used=true WHERE id=$1",
      [player.id],
    );
    return { ok: true };
  });
}
export async function hostAction(
  code: string,
  ownerHash: string | null,
  action: string,
  roundId?: string,
  data?: RoundInput,
) {
  return transaction(async (client) => {
    const game = await lockedGame(client, code);
    ensure(
      ownerHash && game.owner_hash === ownerHash,
      "Du hast für dieses Spiel keine Spielleitung.",
      403,
    );
    ensure(game.status !== "finished", "Dieses Spiel ist beendet.");
    if (action === "add") {
      const count = await client.query(
        "SELECT COUNT(*)::int AS n FROM rounds WHERE game_id=$1",
        [game.id],
      );
      ensure(count.rows[0].n < 50, "Maximal 50 Fragen pro Session.");
      ensure(data, "Frage fehlt.");
      await addRound(client, game.id, roundSchema.parse(data));
    } else if (action === "edit" || action === "delete") {
      const round = (
        await client.query("SELECT * FROM rounds WHERE id=$1 AND game_id=$2", [
          roundId,
          game.id,
        ])
      ).rows[0];
      ensure(
        round?.status === "draft",
        "Nur ungespielte Fragen können bearbeitet werden.",
      );
      if (action === "delete")
        await client.query("DELETE FROM rounds WHERE id=$1", [roundId]);
      else {
        ensure(data, "Frage fehlt.");
        const valid = roundSchema.parse(data);
        await client.query(
          "UPDATE rounds SET question=$1,options=$2,correct=$3,explanation=$4,duration=$5 WHERE id=$6",
          [
            valid.question,
            JSON.stringify(valid.options),
            valid.correct,
            valid.explanation,
            valid.duration,
            roundId,
          ],
        );
      }
    } else if (action === "open") {
      const active = (
        await client.query("SELECT status FROM rounds WHERE id=$1", [
          game.active_round_id,
        ])
      ).rows[0];
      ensure(
        !active || active.status === "revealed",
        "Aktuelle Runde zuerst auflösen.",
      );
      const round = (
        await client.query("SELECT * FROM rounds WHERE id=$1 AND game_id=$2", [
          roundId,
          game.id,
        ])
      ).rows[0];
      ensure(
        round?.status === "draft",
        "Diese Runde kann nicht geöffnet werden.",
      );
      await client.query(
        "UPDATE rounds SET status='open',closes_at=clock_timestamp()+duration*interval '1 second' WHERE id=$1",
        [roundId],
      );
      await client.query(
        "UPDATE games SET status='playing',active_round_id=$1 WHERE id=$2",
        [roundId, game.id],
      );
    } else if (action === "lock" || action === "reveal") {
      const round = (
        await client.query("SELECT * FROM rounds WHERE id=$1 AND game_id=$2", [
          game.active_round_id,
          game.id,
        ])
      ).rows[0];
      ensure(round, "Keine aktive Runde.");
      if (action === "lock") {
        ensure(round.status === "open", "Die Runde ist bereits geschlossen.");
        await client.query(
          "UPDATE rounds SET status='locked',closes_at=LEAST(closes_at,clock_timestamp()) WHERE id=$1",
          [round.id],
        );
      } else {
        if (round.status === "revealed") return { ok: true }; // Idempotent retry.
        ensure(
          round.status === "locked" || !canBet(round.status, round.closes_at),
          "Wetten zuerst schliessen.",
        );
        const bets = (
          await client.query(
            "SELECT b.*,p.balance FROM bets b JOIN players p ON p.id=b.player_id WHERE b.round_id=$1 AND b.payout IS NULL",
            [round.id],
          )
        ).rows;
        for (const bet of bets) {
          const amount =
            bet.option_index === round.correct
              ? Math.min(
                  1_000_000_000 - bet.balance,
                  payout(
                    bet.stake,
                    (round.options as Option[])[round.correct].odds,
                  ),
                )
              : 0;
          await client.query("UPDATE bets SET payout=$1 WHERE id=$2", [
            amount,
            bet.id,
          ]);
          await client.query(
            "UPDATE players SET balance=balance+$1 WHERE id=$2",
            [amount, bet.player_id],
          );
        }
        await client.query("UPDATE rounds SET status='revealed' WHERE id=$1", [
          round.id,
        ]);
      }
    } else if (action === "finish") {
      const active = (
        await client.query("SELECT status FROM rounds WHERE id=$1", [
          game.active_round_id,
        ])
      ).rows[0];
      ensure(
        !active || active.status === "revealed",
        "Aktuelle Runde zuerst auflösen.",
      );
      await client.query("UPDATE games SET status='finished' WHERE id=$1", [
        game.id,
      ]);
    } else ensure(false, "Unbekannte Aktion.");
    return { ok: true };
  });
}
function publicRound(round: Round, host: boolean): Round {
  const { correct, explanation, ...safe } = round;
  return host || round.status === "revealed"
    ? { ...safe, correct, explanation }
    : safe;
}
export async function snapshot(
  code: string,
  tokenHash: string | null,
  ownerHash: string | null,
): Promise<Snapshot> {
  return transaction(async (client) => {
    // Every mutation takes the exclusive game lock. This shared lock makes this multi-query snapshot consistent.
    const game = (
      await client.query("SELECT * FROM games WHERE code=$1 FOR SHARE", [
        normalizeCode(code),
      ])
    ).rows[0];
    ensure(game, "Spiel nicht gefunden.", 404);
    const host = !!ownerHash && game.owner_hash === ownerHash;
    const rounds = (
      await client.query(
        "SELECT * FROM rounds WHERE game_id=$1 ORDER BY position",
        [game.id],
      )
    ).rows;
    const active = rounds.find((r) => r.id === game.active_round_id);
    if (active && active.status === "open") {
      const now = (await client.query("SELECT clock_timestamp() AS now"))
        .rows[0].now;
      if (!canBet(active.status, active.closes_at, new Date(now).getTime()))
        active.status = "locked";
    }
    const players = (
      await client.query(
        "SELECT id,name,avatar,balance,bailout_used,token_hash FROM players WHERE game_id=$1 ORDER BY balance DESC,name ASC",
        [game.id],
      )
    ).rows;
    const own = players.find((p) => p.token_hash === tokenHash);
    const me = own
      ? {
          id: own.id,
          name: own.name,
          avatar: own.avatar,
          balance: own.balance,
          bailout_used: own.bailout_used,
        }
      : null;
    const bet =
      me && active
        ? ((
            await client.query(
              "SELECT option_index,stake,payout,round_id FROM bets WHERE player_id=$1 AND round_id=$2",
              [me.id, active.id],
            )
          ).rows[0] ?? null)
        : null;
    const stats = active
      ? (
          await client.query(
            "SELECT COUNT(*)::int AS n,COUNT(*) FILTER(WHERE all_in)::int AS all_in FROM bets WHERE round_id=$1",
            [active.id],
          )
        ).rows[0]
      : { n: 0, all_in: 0 };
    return {
      serverTime: Date.now(),
      game: { code: game.code, title: game.title, status: game.status },
      round: active ? publicRound(active, host) : null,
      roundCount: rounds.length,
      leaderboard: players.map(({ token_hash: _token, ...player }) => player),
      playerCount: players.length,
      betCount: stats.n,
      allInCount: stats.all_in,
      me,
      bet,
      host,
      ...(host ? { rounds: rounds.map((r) => publicRound(r, true)) } : {}),
    };
  });
}
