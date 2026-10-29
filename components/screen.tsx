"use client";
import { GameAtmosphere, RoundProgress } from "./game-atmosphere";
import { Celebration, LobbyWall, RoundTransition } from "./effects";
import { QRCodeSVG } from "qrcode.react";
import { Check, Users } from "lucide-react";
import type { Snapshot } from "@/lib/types";
import { LiveArena, StandingsShow } from "./host-show";

// This component receives only the public projection of the host state.
export function GameBoard({
  state,
  seconds,
  origin,
  showStandings = false,
}: {
  state: Snapshot;
  seconds: number;
  origin: string;
  showStandings?: boolean;
}) {
  const code = state.game.code;
  const round = state.round;
  const open = round?.status === "open" && seconds > 0;
  const reveal = round?.status === "revealed";
  const finished = state.game.status === "finished";
  const standings = reveal && showStandings;
  return (
    <div
      className={`screen host-board phase-${finished ? "podium" : !round ? "lobby" : reveal ? "reveal" : open ? "open" : "locked"}`}
    >
      <GameAtmosphere />
      {!standings && <RoundTransition state={state} />}
      <Celebration
        trigger={finished ? "finale" : reveal ? round?.id : undefined}
        bigCelebration={finished}
      />
      <div className="ambient-orb orb-a" />
      <div className="ambient-orb orb-b" />
      <div
        className={`screen-layout ${round || finished ? "show-layout" : ""}`}
      >
        {(round || finished) && (
          <div className="stage-room-code">
            BETOOT <b>{code}</b>
          </div>
        )}
        <section className="stage">
          {finished || standings ? (
            <StandingsShow
              key={`${round?.id}-${finished}`}
              state={state}
              final={finished}
            />
          ) : !round ? (
            <div className="lobby-stage">
              <span className="eyebrow">EURE RUNDE WARTET</span>
              <h1>
                ALLE DABEI?
                <br />
                <span>DANN LOS!</span>
              </h1>
              <p>1’000 Coins. Deine Antwort. Alles ist drin.</p>
              <div className="lobby-game-badge">
                ✦ DEIN WISSEN. DEIN GEFÜHL. DEIN MOMENT.
              </div>
              <div className="lobby-stats">
                <Users size={23} />
                <b>{state.playerCount}</b> Mitspielende sind dabei
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
                  {reveal
                    ? "DIE AUFLÖSUNG"
                    : open
                      ? `${seconds}s`
                      : "EINSÄTZE STEHEN"}
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
                <LiveArena state={state} open={!!open} />
              )}
            </div>
          )}
        </section>
        {!round && !finished && (
          <aside className="screen-sidebar">
            <section className="panel qr-panel">
              <span className="section-label">SPIEL MIT!</span>
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
              <p className="fine">
                {!round && !finished
                  ? "QR scannen oder Code eingeben"
                  : "Code auf der Startseite eingeben"}
              </p>
              {origin && (
                <a className="join-url" href={`${origin}/play/${code}`}>
                  {origin.replace(/^https?:\/\//, "")}
                </a>
              )}
            </section>
            <p className="fine center">ZUSAMMEN MACHT’S BETOOT.</p>
          </aside>
        )}
      </div>
    </div>
  );
}
