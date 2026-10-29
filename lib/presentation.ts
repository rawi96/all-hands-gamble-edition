import type { Snapshot } from "./types";

// Host data includes future questions and solutions for the editor. Keep those
// out of the rendered live board, even though both modes use the same URL.
export function presentationState(state: Snapshot): Snapshot {
  const { rounds: _rounds, ...safe } = state;
  let round = state.round;
  if (round && round.status !== "revealed") {
    const { correct: _correct, explanation: _explanation, ...question } = round;
    round = question;
  }
  return { ...safe, host: false, me: null, bet: null, round };
}
