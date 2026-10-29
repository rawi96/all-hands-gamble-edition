import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { presentationState } from "../lib/presentation";
import { GameBoard } from "../components/screen";
import { HostDock } from "../components/host-dock";
import type { Snapshot } from "../lib/types";

const state: Snapshot = {
  serverTime: 1000,
  game: { code: "ABC234", title: "Betoot Quiz", status: "playing" },
  round: {
    id: "current",
    position: 1,
    question: "Öffentliche Frage?",
    options: [
      { label: "Antwort A", odds: 200 },
      { label: "Antwort B", odds: 300 },
    ],
    correct: 1,
    explanation: "SECRET_EXPLANATION",
    duration: 45,
    closes_at: "2026-10-29T20:00:00Z",
    status: "open",
  },
  roundCount: 2,
  leaderboard: [],
  playerCount: 0,
  betCount: 0,
  allInCount: 0,
  me: null,
  bet: null,
  host: true,
  rounds: [
    {
      id: "future",
      position: 2,
      question: "SECRET_FUTURE_QUESTION",
      options: [
        { label: "Future", odds: 200 },
        { label: "Other", odds: 200 },
      ],
      correct: 0,
      explanation: "SECRET_FUTURE_EXPLANATION",
      duration: 45,
      closes_at: null,
      status: "draft",
    },
  ],
};
test("live host board receives no unrevealed solutions or future questions", () => {
  const safe = presentationState(state);
  assert.equal(safe.rounds, undefined);
  assert.equal(safe.round?.correct, undefined);
  assert.equal(safe.round?.explanation, undefined);
  assert.equal(safe.host, false);
  assert.equal(state.round?.correct, 1); // Projection must not mutate editor data.
  const html = renderToStaticMarkup(
    createElement(GameBoard, {
      state: safe,
      seconds: 20,
      origin: "https://example.test",
    }),
  );
  assert.ok(html.includes("Öffentliche Frage?"));
  assert.ok(!html.includes("SECRET_"));
  assert.ok(!html.includes(" correct"));
});
test("only reveal publishes the solution on the shared host board", () => {
  const safe = presentationState({
    ...state,
    round: { ...state.round!, status: "revealed" },
  });
  const html = renderToStaticMarkup(
    createElement(GameBoard, {
      state: safe,
      seconds: 0,
      origin: "https://example.test",
    }),
  );
  assert.ok(html.includes("SECRET_EXPLANATION"));
  assert.ok(html.includes(" correct"));
  assert.ok(!html.includes("SECRET_FUTURE"));
});
test("host navigation never previews the next question on the shared screen", () => {
  const ready = {
    ...state,
    round: { ...state.round!, status: "revealed" as const },
  };
  const html = renderToStaticMarkup(
    createElement(HostDock, {
      state: ready,
      seconds: 0,
      busy: false,
      action: async () => true,
      onPrepare: () => {},
    }),
  );
  assert.ok(html.includes("Nächste Wette öffnen"));
  assert.ok(!html.includes("SECRET_"));
});
