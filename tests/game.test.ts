import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  createGame,
  joinGame,
  snapshot,
  hostAction,
  placeBet,
  bailout,
  roundSchema,
  listGames,
} from "../lib/game";
import { limitGameCreation } from "../lib/rate-limit";
// Embedded PostgreSQL engine exercises real SQL and transactions. PGlite is single-session;
// the test adapter queues connections. Production uses PostgreSQL row locks across connections.
test("full game lifecycle, hidden answers, settlement and invalid actions", async (t) => {
  process.env.DATABASE_URL = "postgresql://embedded-test";
  const engine = new PGlite();
  t.after(async () => {
    await engine.close();
    delete (globalThis as unknown as { betootPool?: unknown }).betootPool;
  });
  await engine.exec(
    await readFile(new URL("../scripts/001-init.sql", import.meta.url), "utf8"),
  );
  await engine.exec(
    await readFile(
      new URL("../scripts/002-open-hosting.sql", import.meta.url),
      "utf8",
    ),
  );
  const owner = "a".repeat(64);
  const otherOwner = "b".repeat(64);
  let gate: Promise<void> = Promise.resolve();
  const query = async (text: string, values?: unknown[]) => {
    const result = await engine.query(text, values);
    return {
      rows: result.rows,
      rowCount: result.affectedRows || result.rows.length,
    };
  };
  const fakePool = {
    query,
    connect: async () => {
      let release!: () => void;
      const previous = gate;
      gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;
      return { query, release };
    },
  };
  (globalThis as unknown as { betootPool: unknown }).betootPool = fakePool;
  const game = await createGame("Integration test", true, owner);
  const initial = await snapshot(game.code, null, owner);
  const first = initial.rounds![0];
  await t.test("lobby, avatars and browser reconnection", async () => {
    assert.equal(initial.roundCount, 3);
    await joinGame(game.code, "Maya", "token-maya", null, "unicorn");
    await joinGame(game.code, "Luca", "token-luca", null, "shark");
    assert.equal(
      (await joinGame(game.code, "Ignored", "other", "token-maya")).resumed,
      true,
    );
    await assert.rejects(joinGame(game.code, "maya", "duplicate", null));
    const state = await snapshot(game.code, "token-maya", null);
    assert.equal(state.me!.balance, 1000);
    assert.equal(state.me!.avatar, "unicorn");
    assert.ok(!JSON.stringify(state).includes("token-maya"));
  });
  await hostAction(game.code, owner, "open", first.id);
  await t.test(
    "a different creator cannot see answers or control a live round",
    async () => {
      const foreignView = await snapshot(game.code, null, otherOwner);
      assert.equal(foreignView.host, false);
      assert.equal(foreignView.round?.correct, undefined);
      assert.equal(foreignView.round?.explanation, undefined);
      assert.equal(foreignView.rounds, undefined);
      await assert.rejects(
        hostAction(game.code, otherOwner, "lock"),
        (error: unknown) => (error as { status: number }).status === 403,
      );
      const ownView = await snapshot(game.code, null, owner);
      assert.equal(ownView.round?.status, "open");
      assert.equal(ownView.round?.correct, 1);
    },
  );

  await t.test(
    "unrevealed answer and future questions never reach player API",
    async () => {
      const state = await snapshot(game.code, "token-maya", null);
      assert.equal(state.round!.correct, undefined);
      assert.equal(state.round!.explanation, undefined);
      assert.equal(state.rounds, undefined);
      await assert.rejects(
        hostAction(game.code, owner, "edit", first.id, {
          ...first,
          correct: 0,
          explanation: first.explanation ?? "",
        }),
      );
      await assert.rejects(
        hostAction(game.code, owner, "open", initial.rounds![1].id),
      );
      await assert.rejects(hostAction(game.code, owner, "reveal"));
    },
  );
  await t.test(
    "negative, unauthenticated and excessive bets fail",
    async () => {
      await assert.rejects(placeBet(game.code, "token-maya", 1, -100));
      await assert.rejects(placeBet(game.code, null, 1, 100));
      await assert.rejects(placeBet(game.code, "token-maya", 1, 1001));
      await assert.rejects(placeBet(game.code, "token-maya", 9, 100));
    },
  );
  await t.test("duplicate concurrent requests debit exactly once", async () => {
    const results = await Promise.allSettled([
      placeBet(game.code, "token-maya", 1, 250),
      placeBet(game.code, "token-maya", 1, 250),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const state = await snapshot(game.code, "token-maya", null);
    assert.equal(state.me!.balance, 750);
    assert.equal(state.bet!.stake, 250);
  });
  await placeBet(game.code, "token-luca", 0, 1000);
  await t.test(
    "all-in cannot claim bailout while payout is pending",
    async () => {
      await assert.rejects(bailout(game.code, "token-luca"));
    },
  );
  await hostAction(game.code, owner, "lock");
  await t.test(
    "closed bets fail; reveal credits once even after retry",
    async () => {
      await assert.rejects(placeBet(game.code, "token-luca", 1, 100));
      await hostAction(game.code, owner, "reveal");
      await hostAction(game.code, owner, "reveal");
      const maya = await snapshot(game.code, "token-maya", null);
      assert.equal(maya.me!.balance, 1250);
      assert.equal(maya.bet!.payout, 500);
      assert.equal(maya.round!.correct, 1);
      assert.equal(
        (await snapshot(game.code, "token-luca", null)).me!.balance,
        0,
      );
    },
  );
  await t.test("bailout grants 300 only once", async () => {
    await bailout(game.code, "token-luca");
    assert.equal(
      (await snapshot(game.code, "token-luca", null)).me!.balance,
      300,
    );
    await assert.rejects(bailout(game.code, "token-luca"));
  });
  await t.test(
    "server deadline rejects bets without a host close action",
    async () => {
      await hostAction(game.code, owner, "open", initial.rounds![1].id);
      await engine.query(
        "UPDATE rounds SET closes_at=clock_timestamp()-interval '1 second' WHERE id=$1",
        [initial.rounds![1].id],
      );
      await assert.rejects(placeBet(game.code, "token-luca", 1, 50));
      assert.equal(
        (await snapshot(game.code, null, null)).round!.status,
        "locked",
      );
      await hostAction(game.code, owner, "reveal");
    },
  );
  await t.test("round IDs cannot cross session boundaries", async () => {
    const other = await createGame("Other room", true, otherOwner);
    await assert.rejects(hostAction(other.code, otherOwner, "open", first.id));
    await assert.rejects(placeBet(other.code, "token-maya", 0, 100));
  });
  await t.test(
    "anonymous creators can manage only their own games",
    async () => {
      const theirs = await createGame("Foreign quiz", false, otherOwner);
      await assert.rejects(
        hostAction(game.code, otherOwner, "finish"),
        (error: unknown) => (error as { status: number }).status === 403,
      );
      await assert.rejects(
        hostAction(game.code, null, "open", first.id),
        (error: unknown) => (error as { status: number }).status === 403,
      );
      const publicView = await snapshot(game.code, null, otherOwner);
      assert.equal(publicView.host, false);
      assert.equal(publicView.rounds, undefined);
      assert.ok(!JSON.stringify(publicView).includes(owner));
      assert.ok(
        (await listGames(owner)).every((item) => item.code !== theirs.code),
      );
      assert.ok(
        (await listGames(otherOwner)).some((item) => item.code === theirs.code),
      );
      assert.deepEqual(await listGames(null), []);
      assert.ok((await snapshot(theirs.code, null, otherOwner)).host);
    },
  );
  await t.test(
    "public creation is rate limited and recovers after its window",
    async () => {
      for (let i = 0; i < 10; i++) await limitGameCreation("fixture-client");
      await assert.rejects(
        limitGameCreation("fixture-client"),
        (error: unknown) => (error as { status: number }).status === 429,
      );
      await engine.query(
        "UPDATE rate_limits SET window_start=now()-interval '16 minutes'",
      );
      await limitGameCreation("fixture-client");
    },
  );
  await t.test(
    "unassigned existing games cannot be claimed using their public code",
    async () => {
      const unassigned = await createGame("Unassigned quiz", false, owner);
      await engine.query("UPDATE games SET owner_hash=NULL WHERE code=$1", [
        unassigned.code,
      ]);
      await assert.rejects(hostAction(unassigned.code, owner, "finish"));
      assert.equal((await snapshot(unassigned.code, null, owner)).host, false);
    },
  );
  await t.test(
    "a new anonymous creator can build, edit and run a quiz from scratch",
    async () => {
      const custom = await createGame("My own quiz", false, owner);
      assert.equal((await snapshot(custom.code, null, owner)).roundCount, 0);
      const question = {
        question: "Wie viel ist sieben mal acht?",
        options: [
          { label: "56", odds: 200 },
          { label: "64", odds: 300 },
        ],
        correct: 0,
        explanation: "Sieben mal acht ist 56.",
        duration: 45,
      };
      await hostAction(custom.code, owner, "add", undefined, question);
      const created = (await snapshot(custom.code, null, owner)).rounds![0];
      await hostAction(custom.code, owner, "edit", created.id, {
        ...question,
        question: "Was ergibt sieben mal acht?",
      });
      assert.equal(
        (await snapshot(custom.code, null, owner)).rounds![0].question,
        "Was ergibt sieben mal acht?",
      );
      await hostAction(custom.code, owner, "add", undefined, {
        ...question,
        question: "Diese Frage wird wieder gelöscht.",
      });
      const second = (await snapshot(custom.code, null, owner)).rounds![1];
      await hostAction(custom.code, owner, "delete", second.id);
      assert.equal((await snapshot(custom.code, null, owner)).roundCount, 1);
      await hostAction(custom.code, owner, "open", created.id);
      assert.equal(
        (await snapshot(custom.code, null, null)).round!.correct,
        undefined,
      );
      await hostAction(custom.code, owner, "lock");
      await hostAction(custom.code, owner, "reveal");
      assert.equal((await snapshot(custom.code, null, null)).round!.correct, 0);
      await hostAction(custom.code, owner, "finish");
      assert.equal(
        (await snapshot(custom.code, null, null)).game.status,
        "finished",
      );
    },
  );
  await t.test(
    "ending keeps leaderboard and prevents new joins or changes",
    async () => {
      await hostAction(game.code, owner, "finish");
      assert.equal(
        (await snapshot(game.code, null, null)).game.status,
        "finished",
      );
      await assert.rejects(joinGame(game.code, "Late", "late", null));
      await assert.rejects(
        hostAction(game.code, owner, "open", initial.rounds![2].id),
      );
    },
  );
  await t.test(
    "question validation rejects nonexistent correct answers",
    () => {
      assert.equal(
        roundSchema.safeParse({
          question: "Valid question?",
          options: [
            { label: "A", odds: 200 },
            { label: "B", odds: 300 },
          ],
          correct: 3,
        }).success,
        false,
      );
    },
  );
});
