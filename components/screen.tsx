"use client";
import { useEffect, useState } from "react";
import { Celebration, Podium, LobbyWall, RoundTransition } from "./effects";
import { QRCodeSVG } from "qrcode.react";
import { Check, Maximize, Users, Flame, Trophy } from "lucide-react";
import {
  ErrorBox,
  Header,
  Leaderboard,
  Live,
  Loading,
  money,
  SoundToggle,
  useCountdown,
  useGame,
} from "./shared";
export function Screen({ code }: { code: string }) {
  const { state, error, offset } = useGame(code);
  const [origin, setOrigin] = useState("");
  const [screenError, setScreenError] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const round = state?.round;
  const seconds = useCountdown(round?.closes_at, offset);
  const open = round?.status === "open" && seconds > 0;
  const reveal = round?.status === "revealed";
  const finished = state?.game.status === "finished";
  return (
    <div className="screen">
      {state && <RoundTransition state={state} />}
      <Celebration
        trigger={finished ? "finale" : reveal ? round?.id : undefined}
        jackpot={finished}
      />
      <div className="ambient-orb orb-a" />
      <div className="ambient-orb orb-b" />
      <Header>
        <Live label={state?.game.title || "LIVE SESSION"} />
        <SoundToggle revealKey={reveal ? round?.id : undefined} />
        <button
          className="icon-button"
          aria-label="Vollbild"
          onClick={() => {
            const action = document.fullscreenElement
              ? document.exitFullscreen()
              : document.documentElement.requestFullscreen();
            void action.catch(() =>
              setScreenError("Vollbild ist in diesem Browser nicht verfügbar."),
            );
          }}
        >
          <Maximize size={19} />
        </button>
      </Header>
      <main className="screen-layout">
        <section className="stage">
          <ErrorBox error={error || screenError} />
          {!state ? (
            <Loading />
          ) : finished ? (
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
          {state && <Leaderboard state={state} limit={7} />}
          <p className="fine center">VIRTUAL COINS. REAL TEAM SPIRIT.</p>
        </aside>
      </main>
    </div>
  );
}
