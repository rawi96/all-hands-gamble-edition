"use client";
import { FormEvent, useState } from "react";
import {
  Avatar,
  AvatarPicker,
  AnimatedCoins,
  Celebration,
  Podium,
  ResultBanner,
} from "./effects";
import {
  Coins,
  Check,
  ArrowRight,
  Trophy,
  LifeBuoy,
  LockKeyhole,
} from "lucide-react";
import {
  api,
  ErrorBox,
  Header,
  Leaderboard,
  Live,
  Loading,
  money,
  useCountdown,
  useGame,
} from "./shared";
export function Play({ code }: { code: string }) {
  const { state, error, refresh, offset } = useGame(code);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("fox");
  const [option, setOption] = useState<number | null>(null);
  const [stake, setStake] = useState(100);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [roundId, setRoundId] = useState("");
  const round = state?.round;
  const seconds = useCountdown(round?.closes_at, offset);
  if (round?.id && round.id !== roundId) {
    setRoundId(round.id);
    setOption(null);
    setStake(100);
    setActionError("");
  }
  async function action(path: string, data: unknown = {}) {
    setBusy(true);
    setActionError("");
    try {
      await api(`/api/games/${code}/${path}`, data);
      await refresh();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const open =
    round?.status === "open" &&
    seconds > 0 &&
    state?.game.status !== "finished";
  return (
    <>
      <Celebration
        trigger={
          state?.game.status === "finished"
            ? "finale"
            : round?.status === "revealed" && state?.bet?.payout
              ? round.id
              : undefined
        }
        jackpot={
          state?.game.status === "finished" ||
          (state?.bet?.payout ?? 0) >= (state?.bet?.stake ?? 1) * 4
        }
      />
      <Header>
        <Live
          label={state?.game.status === "finished" ? "SESSION BEENDET" : code}
        />
      </Header>
      <main className="player-shell">
        <ErrorBox error={error || actionError} />
        {!state ? (
          <Loading />
        ) : !state.me ? (
          <section className="panel join-player">
            <span className="eyebrow">WELCOME TO THE TABLE</span>
            <h1>{state.game.title}</h1>
            {state.game.status === "finished" ? (
              <p>Diese Session ist beendet.</p>
            ) : (
              <>
                <p className="muted">
                  1’000 Coins warten auf dich. Wie sollen wir dich nennen?
                </p>
                <form
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void action("join", { name, avatar });
                  }}
                >
                  <AvatarPicker selected={avatar} onSelect={setAvatar} />
                  <label htmlFor="name">Dein Name</label>
                  <input
                    id="name"
                    value={name}
                    minLength={2}
                    maxLength={24}
                    autoComplete="nickname"
                    required
                    onChange={(e) => setName(e.target.value)}
                  />
                  <button className="button full" disabled={busy}>
                    Platz nehmen <ArrowRight size={18} />
                  </button>
                </form>
                <p className="fine">
                  Dein Platz bleibt in diesem Browser gespeichert. Bitte nur
                  einmal teilnehmen.
                </p>
              </>
            )}
          </section>
        ) : (
          <>
            <div className="wallet">
              <Avatar id={state.me.avatar} size="wallet" />
              <div className="wallet-content">
                <span className="eyebrow">
                  {state.me.name.toUpperCase()} / DEIN STACK
                </span>
                <div className="balance">
                  <Coins />
                  <AnimatedCoins amount={state.me.balance} />
                  <small>COINS</small>
                </div>
              </div>
              <span className="wallet-rank">
                #{state.leaderboard.findIndex((p) => p.id === state.me!.id) + 1}
              </span>
            </div>
            {state.game.status === "finished" ? (
              <section className="panel result-panel">
                <Trophy size={44} />
                <span className="eyebrow">THAT’S A WRAP</span>
                <h1>{state.leaderboard[0]?.name} gewinnt!</h1>
                <Podium players={state.leaderboard} ownId={state.me.id} />
                <p>
                  Dein Ergebnis: <b>{money(state.me.balance)} Coins</b>. Danke
                  fürs Mitspielen.
                </p>
              </section>
            ) : !round ? (
              <section className="panel waiting">
                <span className="large-symbol">♠</span>
                <h2>Dein Platz ist reserviert.</h2>
                <p className="muted">
                  Lehn dich zurück. Die erste Wette kommt gleich.
                </p>
                <Live label={`${state.playerCount} AM TISCH`} />
              </section>
            ) : (
              <section className="panel bet-panel" key={round.id}>
                <div className="round-meta">
                  <span className="eyebrow">
                    RUNDE {round.position} / {state.roundCount}
                  </span>
                  <span
                    className={`timer ${open && seconds <= 5 ? "urgent" : ""} ${open ? "" : "closed"}`}
                  >
                    {round.status === "revealed"
                      ? "REVEAL"
                      : open
                        ? `${seconds}s`
                        : "BETS CLOSED"}
                  </span>
                </div>
                <h1 className="question">{round.question}</h1>
                <div className="options">
                  {round.options.map((answer, index) => {
                    const correct =
                      round.status === "revealed" && round.correct === index;
                    return (
                      <button
                        key={index}
                        className={`option answer-${index} ${option === index || state.bet?.option_index === index ? "chosen" : ""} ${correct ? "correct" : ""}`}
                        disabled={!open || !!state.bet || busy}
                        onClick={() => setOption(index)}
                      >
                        <span className="option-letter">
                          {correct ? (
                            <Check size={18} />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </span>
                        <span>{answer.label}</span>
                        <b>× {(answer.odds / 100).toFixed(1)}</b>
                      </button>
                    );
                  })}
                </div>
                {state.bet ? (
                  <div className="bet-receipt">
                    {round.status === "revealed" ? (
                      <>
                        <ResultBanner
                          payout={state.bet.payout ?? 0}
                          stake={state.bet.stake}
                        />
                        <span
                          className={state.bet.payout ? "positive" : "muted"}
                        >
                          {state.bet.payout
                            ? `+${money(state.bet.payout)} Coins ausgezahlt!`
                            : "Dieses Mal gewinnt die Bank."}
                        </span>
                        <p>{round.explanation}</p>
                        <small>
                          Einsatz: {money(state.bet.stake)} · Netto:{" "}
                          {money((state.bet.payout ?? 0) - state.bet.stake)}{" "}
                          Coins
                        </small>
                      </>
                    ) : (
                      <>
                        <Check size={19} />
                        <strong>{money(state.bet.stake)} Coins gesetzt.</strong>
                        <p>
                          Dein Einsatz steht. Jetzt das Update verfolgen und
                          mitfiebern.
                        </p>
                      </>
                    )}
                  </div>
                ) : round.status === "revealed" ? (
                  <div className="bet-receipt">
                    <b>Runde aufgelöst</b>
                    <p>{round.explanation}</p>
                    <small>Du hast diese Runde ausgesetzt.</small>
                  </div>
                ) : open ? (
                  <>
                    <label className="section-label">DEIN EINSATZ</label>
                    <div className="stakes">
                      {[50, 100, 250].map((amount) => (
                        <button
                          key={amount}
                          className={`stake ${stake === amount ? "active" : ""}`}
                          disabled={amount > state.me!.balance || busy}
                          onClick={() => setStake(amount)}
                        >
                          {amount}
                        </button>
                      ))}
                      <button
                        className={`stake all-in ${stake === state.me.balance ? "active" : ""}`}
                        disabled={state.me.balance === 0 || busy}
                        onClick={() => setStake(state.me!.balance)}
                      >
                        ALL IN 🔥
                      </button>
                    </div>
                    <button
                      className="button full bet-submit"
                      disabled={
                        busy ||
                        option === null ||
                        stake > state.me.balance ||
                        stake < 1
                      }
                      onClick={() => void action("bet", { option, stake })}
                    >
                      {" "}
                      {busy
                        ? "Wird gesetzt …"
                        : `${money(stake)} Coins setzen`}{" "}
                      <ArrowRight size={18} />
                    </button>
                    <p className="fine">
                      Verbindlicher Einsatz. Quote inklusive Einsatz. Auszahlung
                      wird auf ganze Coins abgerundet.
                    </p>
                  </>
                ) : (
                  <div className="bet-receipt">
                    <LockKeyhole size={20} />
                    <b>Die Wetten sind geschlossen.</b>
                    <p>Gleich wird aufgelöst. Schau auf den grossen Screen.</p>
                  </div>
                )}
              </section>
            )}
            {state.me.balance === 0 &&
              !state.me.bailout_used &&
              (!state.bet || state.bet.payout !== null) &&
              state.game.status !== "finished" && (
                <button
                  className="button secondary full"
                  disabled={busy}
                  onClick={() => void action("bailout")}
                >
                  <LifeBuoy size={18} /> Einmaliger Bailout: +300 Coins
                </button>
              )}
            <Leaderboard state={state} />
            <p className="fine center">
              Nur virtuelle Coins. Gewinne sind nicht auszahlbar.
            </p>
          </>
        )}
      </main>
    </>
  );
}
