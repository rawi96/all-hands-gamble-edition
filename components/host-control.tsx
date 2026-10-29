"use client";
import { FormEvent, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Play,
  LockKeyhole,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Maximize,
  MonitorPlay,
} from "lucide-react";
import { GameBoard } from "./screen";
import { HostDock } from "./host-dock";
import { presentationState } from "@/lib/presentation";
import { GameAudio } from "./game-audio";
import type { Round } from "@/lib/types";
import {
  api,
  ErrorBox,
  Header,
  Leaderboard,
  Live,
  Loading,
  useCountdown,
  useGame,
} from "./shared";
type Draft = {
  question: string;
  options: { label: string; odds: string }[];
  correct: number;
  explanation: string;
  duration: number;
};
const empty = (): Draft => ({
  question: "",
  options: [
    { label: "", odds: "2" },
    { label: "", odds: "3" },
    { label: "", odds: "4" },
  ],
  correct: 0,
  explanation: "",
  duration: 45,
});
export function HostControl({
  code,
  startInPreparation = false,
}: {
  code: string;
  startInPreparation?: boolean;
}) {
  const { state, error, refresh, offset } = useGame(code, true);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [standingsRound, setStandingsRound] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(startInPreparation);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!editing) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const selector =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]';
    dialog?.querySelector<HTMLElement>("#question")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEditing(null);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(
        dialog?.querySelectorAll<HTMLElement>(selector) || [],
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [editing]);
  const seconds = useCountdown(state?.round?.closes_at, offset);
  useEffect(() => setOrigin(window.location.origin), []);
  async function action(action: string, roundId?: string, data?: unknown) {
    setBusy(true);
    setActionError("");
    try {
      await api(`/api/games/${code}/action`, { action, roundId, data });
      await refresh();
      return true;
    } catch (e) {
      setActionError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function edit(round?: Round) {
    setEditing(round?.id || "new");
    setDraft(
      round
        ? {
            question: round.question,
            options: round.options.map((o) => ({
              label: o.label,
              odds: String(o.odds / 100),
            })),
            correct: round.correct ?? 0,
            explanation: round.explanation || "",
            duration: round.duration,
          }
        : empty(),
    );
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    const data = {
      ...draft,
      options: draft.options.map((o) => ({
        label: o.label,
        odds: Math.round(Number(o.odds) * 100),
      })),
    };
    if (
      await action(
        editing === "new" ? "add" : "edit",
        editing === "new" ? undefined : editing!,
        data,
      )
    )
      setEditing(null);
  }
  const round = state?.round;
  const active = round && round.status !== "revealed";
  const finished = state?.game.status === "finished";
  return (
    <>
      <Header>
        <Link className="muted small" href="/host">
          Meine Spiele
        </Link>
        <button
          className={`button secondary small ${preparing ? "" : "active-mode"}`}
          onClick={() => {
            setPreparing(false);
            setEditing(null);
          }}
        >
          <MonitorPlay size={15} /> Live-Spiel
        </button>
        <button
          className={`button secondary small ${preparing ? "active-mode" : ""}`}
          onClick={() => setPreparing(true)}
        >
          <Pencil size={15} /> Vorbereitung (privat)
        </button>
        {!preparing && (
          <>
            <GameAudio
              state={state}
              seconds={seconds}
              standings={standingsRound === round?.id}
            />
            <button
              className="icon-button"
              aria-label="Vollbild"
              onClick={() => {
                const task = document.fullscreenElement
                  ? document.exitFullscreen()
                  : document.documentElement.requestFullscreen();
                void task.catch(() =>
                  setActionError(
                    "Vollbild ist in diesem Browser nicht verfügbar.",
                  ),
                );
              }}
            >
              <Maximize size={18} />
            </button>
          </>
        )}
      </Header>
      <main className={preparing ? "control-shell" : "host-show"}>
        <ErrorBox error={error || actionError} />
        {!state ? (
          <Loading />
        ) : !state.host ? (
          <section className="panel form-panel">
            <h2>Hier hast du keine Spielleitung</h2>
            <Link className="button" href="/host">
              Eigenes Spiel erstellen
            </Link>
          </section>
        ) : !preparing ? (
          <>
            <GameBoard
              state={presentationState(state)}
              seconds={seconds}
              origin={origin}
              showStandings={standingsRound === round?.id}
            />
            <HostDock
              state={state}
              seconds={seconds}
              busy={busy}
              action={action}
              onPrepare={() => setPreparing(true)}
              showStandings={standingsRound === round?.id}
              onStandings={() => setStandingsRound(round?.id || null)}
            />
          </>
        ) : (
          <>
            <div className="private-preparation">
              <LockKeyhole size={17} />
              <b>PRIVATE VORBEREITUNG</b>
              <span>
                Hier sind Lösungen und kommende Fragen sichtbar. Vor dem Teilen
                auf „Live-Spiel“ wechseln.
              </span>
            </div>
            <div className="control-heading">
              <div>
                <span className="eyebrow">SPIELLEITUNG / {code}</span>
                <h1>{state.game.title}</h1>
              </div>
              <Live label={finished ? "BEENDET" : "DEINE RUNDE"} />
            </div>
            <div className="control-grid">
              <section className="control-main">
                <div className="list-heading">
                  <h2>
                    Deine Fragen{" "}
                    <span className="muted">({state.rounds?.length})</span>
                  </h2>
                  {!finished && (
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={() => edit()}
                    >
                      <Plus size={16} /> Frage
                    </button>
                  )}
                </div>
                <div className="round-list">
                  {!state.rounds?.length && (
                    <div className="panel empty">
                      Noch keine Fragen. Erstelle deine erste Wette.
                    </div>
                  )}
                  {state.rounds?.map((item) => (
                    <div
                      className={`panel round-row ${item.id === round?.id ? "current" : ""}`}
                      key={item.id}
                    >
                      <span className="round-number">
                        {String(item.position).padStart(2, "0")}
                      </span>
                      <div className="round-description">
                        <b>{item.question}</b>
                        <small>
                          {item.duration}s · {item.options.length} Antworten ·{" "}
                          {item.status === "draft"
                            ? "Vorbereitet"
                            : item.status === "revealed"
                              ? "Aufgelöst"
                              : "Aktiv"}
                        </small>
                      </div>
                      {item.status === "draft" && !finished && (
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            aria-label="Frage bearbeiten"
                            disabled={busy}
                            onClick={() => edit(item)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-button"
                            aria-label="Ungespielte Frage löschen"
                            disabled={busy}
                            onClick={() => void action("delete", item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            className="button small"
                            disabled={busy || !!active}
                            onClick={() => {
                              void action("open", item.id).then((ok) => {
                                if (ok) setPreparing(false);
                              });
                            }}
                          >
                            <Play size={14} /> Öffnen
                          </button>
                        </div>
                      )}
                      {item.status === "revealed" && (
                        <Check className="positive" size={20} />
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <aside>
                <section className="panel form-panel">
                  <span className="section-label">DEINE SESSION-LINKS</span>
                  <label>Spielcode</label>
                  <div className="room-code">{code}</div>
                  <button
                    className="button secondary full"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(`${origin}/play/${code}`)
                        .then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        })
                        .catch(() =>
                          setActionError(
                            "Kopieren nicht möglich. Nutze den Teilnahme-Link darunter.",
                          ),
                        );
                    }}
                  >
                    <Copy size={16} />
                    {copied ? "Link kopiert!" : "Teilnahme-Link kopieren"}
                  </button>
                  <Link
                    className="text-link"
                    href={`/play/${code}`}
                    target="_blank"
                  >
                    Teilnahme öffnen <ExternalLink size={14} />
                  </Link>
                  <button
                    className="button full"
                    style={{ marginTop: 20 }}
                    onClick={() => setPreparing(false)}
                  >
                    <MonitorPlay size={17} /> Zurück zum Live-Spiel
                  </button>
                  <p className="fine">
                    Eine Host-Ansicht für Steuerung und Beamer. Im Live-Spiel
                    bleiben Lösungen bis zum Reveal verborgen.
                  </p>
                </section>
                <Leaderboard state={state} />
                <section className="host-tips">
                  <b>Dein Ablauf</b>
                  <p>
                    ① Wette öffnen
                    <br />② Einsätze schliessen
                    <br />③ Slides oder Demo zeigen
                    <br />④ Zurückkommen & auflösen
                  </p>
                  <p className="fine">
                    Alle starten mit 1’000 Coins. Einmaliges Comeback bei 0:
                    +300. Pro Runde ein verbindlicher Einsatz.
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
        {editing && (
          <div className="modal-backdrop">
            <section
              ref={dialogRef}
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="editor-title"
            >
              <div className="list-heading">
                <h2 id="editor-title">
                  {editing === "new" ? "Neue Wette" : "Wette bearbeiten"}
                </h2>
                <button
                  className="icon-button"
                  aria-label="Schliessen"
                  onClick={() => setEditing(null)}
                >
                  <X />
                </button>
              </div>
              <ErrorBox error={actionError} />
              <form onSubmit={save}>
                <label htmlFor="question">Frage</label>
                <textarea
                  id="question"
                  value={draft.question}
                  minLength={5}
                  maxLength={240}
                  required
                  onChange={(e) =>
                    setDraft({ ...draft, question: e.target.value })
                  }
                />
                <div className="editor-labels">
                  <span>Antworten · richtige Antwort markieren</span>
                  <span>Quote ×</span>
                </div>
                {draft.options.map((answer, index) => (
                  <div className="editor-option" key={index}>
                    <input
                      type="radio"
                      name="correct"
                      aria-label={`Antwort ${String.fromCharCode(65 + index)} ist richtig`}
                      checked={draft.correct === index}
                      onChange={() => setDraft({ ...draft, correct: index })}
                    />
                    <input
                      aria-label={`Antwort ${String.fromCharCode(65 + index)}`}
                      value={answer.label}
                      required
                      maxLength={120}
                      placeholder={`Antwort ${String.fromCharCode(65 + index)}`}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          options: draft.options.map((o, i) =>
                            i === index ? { ...o, label: e.target.value } : o,
                          ),
                        })
                      }
                    />
                    <input
                      aria-label={`Quote für Antwort ${String.fromCharCode(65 + index)}`}
                      type="number"
                      min={1.1}
                      max={20}
                      step={0.1}
                      required
                      value={answer.odds}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          options: draft.options.map((o, i) =>
                            i === index ? { ...o, odds: e.target.value } : o,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
                <div className="editor-actions">
                  {draft.options.length < 4 && (
                    <button
                      type="button"
                      className="button secondary small"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          options: [...draft.options, { label: "", odds: "3" }],
                        })
                      }
                    >
                      + Antwort
                    </button>
                  )}
                  {draft.options.length > 2 && (
                    <button
                      type="button"
                      className="button secondary small"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          options: draft.options.slice(0, -1),
                          correct: Math.min(
                            draft.correct,
                            draft.options.length - 2,
                          ),
                        })
                      }
                    >
                      Letzte entfernen
                    </button>
                  )}
                </div>
                <label htmlFor="duration">
                  Wettfenster in Sekunden (15–300)
                </label>
                <input
                  id="duration"
                  type="number"
                  min={15}
                  max={300}
                  required
                  value={draft.duration}
                  onChange={(e) =>
                    setDraft({ ...draft, duration: Number(e.target.value) })
                  }
                />
                <label htmlFor="explanation">Auflösung / Kontext</label>
                <textarea
                  id="explanation"
                  maxLength={600}
                  value={draft.explanation}
                  placeholder="Zum Beispiel: Tatsächlich waren es 187 Deployments."
                  onChange={(e) =>
                    setDraft({ ...draft, explanation: e.target.value })
                  }
                />
                <p className="fine">
                  Quote × 3: 100 Coins Einsatz ergeben bei Gewinn 300 Coins
                  Auszahlung. Quoten bleiben während der Runde fest.
                </p>
                <button className="button full" disabled={busy}>
                  {busy ? "Wird gespeichert …" : "Wette speichern"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
