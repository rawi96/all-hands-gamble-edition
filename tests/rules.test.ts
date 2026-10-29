import { test } from "node:test";
import assert from "node:assert/strict";
import { canBet, normalizeCode, payout } from "../lib/rules";
test("quotes include the stake and payouts are rounded down", () => {
  assert.equal(payout(100, 300), 300);
  assert.equal(payout(51, 150), 76);
  assert.throws(() => payout(-1, 200));
  assert.throws(() => payout(50, 99));
});
test("server deadline is exclusive and cannot be extended by client status", () => {
  assert.equal(canBet("open", new Date(1000), 999), true);
  assert.equal(canBet("open", new Date(1000), 1000), false);
  assert.equal(canBet("locked", new Date(2000), 999), false);
  assert.equal(canBet("revealed", new Date(2000), 999), false);
  assert.equal(normalizeCode(" abc234 "), "ABC234");
});
