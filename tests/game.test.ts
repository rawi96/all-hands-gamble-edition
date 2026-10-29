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
} from "../lib/game";
// Embedded PostgreSQL engine exercises real SQL and transactions. PGlite is single-session;
// the test adapter queues connections. Production uses PostgreSQL row locks across connections.
test("full game lifecycle, hidden answers, settlement and invalid actions", async (t) => {
  process.env.DATABASE_URL = "postgresql://embedded-test";
  const engine = new PGlite();
  t.after(async () => {
    await engine.close();
    delete (globalThis as unknown as { casinoPool?: unknown }).casinoPool;
  });
  await engine.exec(
    await readFile(new URL("../scripts/001-init.sql", import.meta.url), "utf8"),
  );
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
  (globalThis as unknown as { casinoPool: unknown }).casinoPool = fakePool;
  const game = await createGame("Integration test", true);
  const initial = await snapshot(game.code, null, true);
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
    const state = await snapshot(game.code, "token-maya", false);
    assert.equal(state.me!.balance, 1000);
    assert.equal(state.me!.avatar, "unicorn");
    assert.ok(!JSON.stringify(state).includes("token-maya"));
  });
  await hostAction(game.code, "open", first.id);
  await t.test(
    "unrevealed answer and future questions never reach player API",
    async () => {
      const state = await snapshot(game.code, "token-maya", false);
      assert.equal(state.round!.correct, undefined);
      assert.equal(state.round!.explanation, undefined);
      assert.equal(state.rounds, undefined);
      await assert.rejects(
        hostAction(game.code, "edit", first.id, {
          ...first,
          correct: 0,
          explanation: first.explanation ?? "",
        }),
      );
      await assert.rejects(
        hostAction(game.code, "open", initial.rounds![1].id),
      );
      await assert.rejects(hostAction(game.code, "reveal"));
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
    const state = await snapshot(game.code, "token-maya", false);
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
  await hostAction(game.code, "lock");
  await t.test(
    "closed bets fail; reveal credits once even after retry",
    async () => {
      await assert.rejects(placeBet(game.code, "token-luca", 1, 100));
      await hostAction(game.code, "reveal");
      await hostAction(game.code, "reveal");
      const maya = await snapshot(game.code, "token-maya", false);
      assert.equal(maya.me!.balance, 1250);
      assert.equal(maya.bet!.payout, 500);
      assert.equal(maya.round!.correct, 1);
      assert.equal(
        (await snapshot(game.code, "token-luca", false)).me!.balance,
        0,
      );
    },
  );
  await t.test("bailout grants 300 only once", async () => {
    await bailout(game.code, "token-luca");
    assert.equal(
      (await snapshot(game.code, "token-luca", false)).me!.balance,
      300,
    );
    await assert.rejects(bailout(game.code, "token-luca"));
  });
  await t.test(
    "server deadline rejects bets without a host close action",
    async () => {
      await hostAction(game.code, "open", initial.rounds![1].id);
      await engine.query(
        "UPDATE rounds SET closes_at=clock_timestamp()-interval '1 second' WHERE id=$1",
        [initial.rounds![1].id],
      );
      await assert.rejects(placeBet(game.code, "token-luca", 1, 50));
      assert.equal(
        (await snapshot(game.code, null, false)).round!.status,
        "locked",
      );
      await hostAction(game.code, "reveal");
    },
  );
  await t.test("round IDs cannot cross session boundaries", async () => {
    const other = await createGame("Other room", true);
    await assert.rejects(hostAction(other.code, "open", first.id));
    await assert.rejects(placeBet(other.code, "token-maya", 0, 100));
  });
  await t.test(
    "ending keeps leaderboard and prevents new joins or changes",
    async () => {
      await hostAction(game.code, "finish");
      assert.equal(
        (await snapshot(game.code, null, false)).game.status,
        "finished",
      );
      await assert.rejects(joinGame(game.code, "Late", "late", null));
      await assert.rejects(
        hostAction(game.code, "open", initial.rounds![2].id),
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
