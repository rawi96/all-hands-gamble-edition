export class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function ensure(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new GameError(message, status);
}
export function payout(stake: number, odds: number) {
  ensure(Number.isSafeInteger(stake) && stake > 0, "Ungültiger Einsatz.");
  ensure(
    Number.isInteger(odds) && odds >= 110 && odds <= 2000,
    "Ungültige Quote.",
  );
  return Math.floor((stake * odds) / 100);
}
export function canBet(
  status: string,
  closesAt: Date | string | null,
  now = Date.now(),
) {
  return (
    status === "open" && closesAt !== null && new Date(closesAt).getTime() > now
  );
}
export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}
