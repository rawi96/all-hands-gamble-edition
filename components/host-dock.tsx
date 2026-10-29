"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Play,
  LockKeyhole,
  Sparkles,
  Trophy,
  Pencil,
  Check,
} from "lucide-react";
import type { Snapshot } from "@/lib/types";

type Props = {
  state: Snapshot;
  seconds: number;
  busy: boolean;
  action: (action: string, roundId?: string) => Promise<boolean>;
  onPrepare: () => void;
  showStandings?: boolean;
  onStandings?: () => void;
};
export function HostDock({
  state,
  seconds,
  busy,
  action,
  onPrepare,
  showStandings = false,
  onStandings,
}: Props) {
  const [confirmFinish, setConfirmFinish] = useState(false);
  const round = state.round;
  const active = round && round.status !== "revealed";
  const open = round?.status === "open" && seconds > 0;
  const next = state.rounds?.find((item) => item.status === "draft");
  const finished = state.game.status === "finished";
  const label = finished
    ? "Danke fürs Mitspielen!"
    : open
      ? "Die Wetten laufen."
      : active
        ? "Einsätze stehen. Zeit fürs Update."
        : round
          ? showStandings
            ? "Neue Plätze. Bereit für die nächste Frage?"
            : "Coins verteilt. Zeit für den Zwischenstand."
          : "Alle da? Dann kann’s losgehen.";
  return (
    <div className="host-dock">
      <div className="host-dock-inner">
        <div className="dock-caption">
          <span className="eyebrow">HOST / {state.game.code}</span>
          <span>{label}</span>
        </div>
        <div className="dock-actions">
          {finished ? (
            <Link className="button" href="/host">
              Neue Session
            </Link>
          ) : confirmFinish ? (
            <>
              <span className="dock-confirm">
                Restliche Fragen überspringen und Finale zeigen?
              </span>
              <button
                className="button"
                disabled={busy || !!active}
                onClick={() =>
                  void action("finish").then((ok) => {
                    if (ok) setConfirmFinish(false);
                  })
                }
              >
                <Trophy size={18} /> Ja, Finale starten
              </button>
              <button
                className="button secondary small"
                disabled={busy}
                onClick={() => setConfirmFinish(false)}
              >
                Abbrechen
              </button>
            </>
          ) : (
            <>
              {open ? (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void action("lock")}
                >
                  <LockKeyhole size={18} /> Wetten schliessen
                </button>
              ) : active ? (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void action("reveal")}
                >
                  <Sparkles size={18} /> Auflösen & auszahlen
                </button>
              ) : round?.status === "revealed" && !showStandings ? (
                <button
                  className="button"
                  disabled={busy}
                  onClick={onStandings}
                >
                  <Trophy size={18} /> Zwischenstand zeigen
                </button>
              ) : next ? (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void action("open", next.id)}
                >
                  <Play size={18} />
                  {round ? "Nächste Wette öffnen" : "Erste Wette öffnen"}
                </button>
              ) : !state.roundCount ? (
                <button className="button" onClick={onPrepare}>
                  <Pencil size={17} /> Fragen vorbereiten
                </button>
              ) : (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void action("finish")}
                >
                  <Trophy size={18} /> Finale starten
                </button>
              )}
              {!active && next && (!round || showStandings) && (
                <button
                  className="button secondary small"
                  disabled={busy}
                  onClick={() => setConfirmFinish(true)}
                >
                  Zum Finale
                </button>
              )}
              {active && (
                <span className="dock-safe">
                  <Check size={14} /> Lösungen bleiben verborgen
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
