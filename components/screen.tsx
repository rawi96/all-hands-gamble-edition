"use client";
import { GameAtmosphere, RoundProgress } from "./game-atmosphere";
import { Celebration, Podium, LobbyWall, RoundTransition } from "./effects";
import { QRCodeSVG } from "qrcode.react";
import { Check, Users, Flame, Trophy } from "lucide-react";
import type { Snapshot } from "@/lib/types";
import { Leaderboard } from "./shared";

// This component receives only the public projection of the host state.
export function GameBoard({
  state,
  seconds,
  origin,
}: {
  state: Snapshot;
  seconds: number;
  origin: string;
}) {
  const code = state.game.code;
  const round = state.round;
  const open = round?.status === "open" && seconds > 0;
  const reveal = round?.status === "revealed";
  const finished = state.game.status === "finished";
  return (
    <div
      className={`screen host-board phase-${finished ? "podium" : !round ? "lobby" : reveal ? "reveal" : open ? "open" : "locked"}`}
    >
      <GameAtmosphere />
      <RoundTransition state={state} />
      <Celebration
        trigger={finished ? "finale" : reveal ? round?.id : undefined}
        jackpot={finished}
      />
      <div className="ambient-orb orb-a" />
      <div className="ambient-orb orb-b" />
      <div className="screen-layout">
        <section className="stage">
          {finished ? (
            <div className="finale">
              <Trophy size={76} />
              <span className="eyebrow">THE HOUSE HAS A WINNER.</span>
              <h1 className="finale-title">THE HIGH ROLLERS.</h1>
              <Podium players={state.leaderboard} />
              <p>
                Grosse Einsätze. Grosse Geschichten. Bis zum nächsten All Hands.
              </p>
            </div>
          ) : !round ? (
            <div className="lobby-stage">
              <span className="eyebrow">THE TABLE IS OPEN</span>
              <h1>
                TAKE A SEAT.
                <br />
                <span>MAKE YOUR BET.</span>
              </h1>
              <p>1’000 Coins. Ein Team. Alles kann passieren.</p>
              <div className="lobby-game-badge">
                🎰 DEIN TEAM. DEIN EINSATZ. DEIN MOMENT.
              </div>
              <div className="lobby-stats">
                <Users size={23} />
                <b>{state.playerCount}</b> Players am Tisch
              </div>
              <LobbyWall players={state.leaderboard} />
            </div>
          ) : (
            <div
              className={`live-round ${reveal ? "revealed" : ""}`}
              key={`${round.id}-${reveal}`}
            >
              <div className="round-meta">
                <span className="eyebrow">
                  RUNDE {round.position} / {state.roundCount}
                </span>
                <span
                  className={`timer large ${open && seconds <= 5 ? "urgent" : ""} ${open ? "" : "closed"}`}
                >
                  {reveal ? "THE REVEAL" : open ? `${seconds}s` : "BETS CLOSED"}
                </span>
              </div>
              <h1>{round.question}</h1>
              <RoundProgress
                seconds={seconds}
                duration={round.duration}
                running={open}
              />
              <div className="screen-options">
                {round.options.map((option, index) => (
                  <div
                    key={index}
                    className={`option answer-${index} ${reveal && round.correct === index ? "correct" : ""} ${reveal && round.correct !== index ? "faded" : ""}`}
                  >
                    <span className="option-letter">
                      {reveal && round.correct === index ? (
                        <Check />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </span>
                    <span>{option.label}</span>
                    <b>× {(option.odds / 100).toFixed(1)}</b>
                  </div>
                ))}
              </div>
              {reveal ? (
                <div className="reveal-explanation">
                  <span className="eyebrow">DIE AUFLÖSUNG</span>
                  <p>
                    {round.explanation ||
                      "Die Coins sind verteilt. Wer hat richtig gelegen?"}
                  </p>
                </div>
              ) : (
                <div className="round-stats">
                  <span>
                    <Users size={20} />
                    <strong>{state.betCount}</strong> / {state.playerCount}{" "}
                    gesetzt
                  </span>
                  <span>
                    <Flame size={20} />
                    <strong>{state.allInCount}</strong> ALL IN
                  </span>
                  {!open && (
                    <span className="muted">
                      Einsätze stehen. Zeit fürs Update.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
        <aside className="screen-sidebar">
          <section className="panel qr-panel">
            <span className="section-label">JOIN THE TABLE</span>
            {origin && (
              <div className="qr">
                <QRCodeSVG
                  value={`${origin}/play/${code}`}
                  size={152}
                  level="M"
                />
              </div>
            )}
            <div className="room-code">{code}</div>
            <p className="fine">QR scannen oder Code eingeben</p>
            {origin && (
              <a className="join-url" href={`${origin}/play/${code}`}>
                {origin.replace(/^https?:\/\//, "")}
              </a>
            )}
          </section>
          {state && <Leaderboard state={state} limit={5} />}
          <p className="fine center">VIRTUAL COINS. REAL TEAM SPIRIT.</p>
        </aside>
      </div>
    </div>
  );
}
