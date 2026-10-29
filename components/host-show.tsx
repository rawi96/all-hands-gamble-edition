"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Coins, Flame, Check } from "lucide-react";
import type { Snapshot } from "@/lib/types";
import { Avatar, AnimatedCoins, Podium, Celebration } from "./effects";

export function LiveArena({ state, open }: { state: Snapshot; open: boolean }) {
  const reduced = useReducedMotion();
  const progress = state.playerCount
    ? Math.min(100, (state.betCount / state.playerCount) * 100)
    : 0;
  const everyone =
    state.playerCount > 0 && state.betCount === state.playerCount;
  return (
    <section
      className={`live-arena ${everyone ? "everyone-in" : ""}`}
      aria-label="Live-Spielaktivität"
    >
      <div className="arena-metrics">
        <div className="arena-metric answered-metric">
          <span>
            <Check size={19} /> SCHON GETIPPT
          </span>
          <strong>
            <AnimatedCoins amount={state.betCount} />
            <small> / {state.playerCount}</small>
          </strong>
        </div>
        <div className="arena-metric pot-metric">
          <span>
            <Coins size={19} /> COINS IM SPIEL
          </span>
          <strong>
            <AnimatedCoins amount={state.hostStats?.totalStake ?? 0} />
            <small> ●</small>
          </strong>
        </div>
        <div
          className={`arena-metric allin-metric ${state.allInCount ? "has-allins" : ""}`}
        >
          <span>
            <Flame size={19} /> ALL IN
          </span>
          <motion.strong
            key={state.allInCount}
            initial={reduced || !state.allInCount ? false : { scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 12 }}
          >
            <AnimatedCoins amount={state.allInCount} />
            <small> {state.allInCount === 1 ? "Person" : "Leute"}</small>
          </motion.strong>
        </div>
      </div>
      <div
        className="participation-track"
        role="progressbar"
        aria-label="Abgegebene Tipps"
        aria-valuemin={0}
        aria-valuemax={state.playerCount || 1}
        aria-valuenow={state.betCount}
      >
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: reduced ? 0 : 0.5 }}
        />
      </div>
      <div className="arena-bottom">
        <span className="arena-status">
          {everyone
            ? "✦ ALLE TIPPS SIND DRIN!"
            : open
              ? "LIVE · DIE RUNDE LÄUFT"
              : "TIPPS STEHEN · GLEICH WIRD AUFGELÖST"}
        </span>
        <div className="activity-stream" aria-label="Letzte Einsätze">
          <AnimatePresence initial={false} mode="popLayout">
            {state.hostStats?.recentBets.slice(0, 3).map((event) => (
              <motion.div
                key={event.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 25, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`activity-chip ${event.allIn ? "activity-allin" : ""}`}
              >
                <Avatar id={event.avatar} size="tiny" />
                <b>{event.name}</b>
                <span>{event.allIn ? "ALL IN!" : `${event.stake} Coins`}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export function StandingsShow({
  state,
  final = false,
}: {
  state: Snapshot;
  final?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      className={`standings-show ${final ? "final-standings" : ""}`}
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
      aria-label={final ? "Finales Podium" : "Zwischenstand"}
    >
      <Celebration
        trigger={`${state.round?.id ?? "game"}-${final ? "final" : "standings"}`}
        bigCelebration={final}
      />
      <div className="standings-kicker">
        <span>✦</span>{" "}
        {final
          ? "DAS GROSSE FINALE"
          : `RUNDE ${state.round?.position} GESPIELT`}{" "}
        <span>✦</span>
      </div>
      <h1>{final ? "Eure Quiz-Legenden!" : "Wer ist jetzt vorne?"}</h1>
      <p>
        {final
          ? "Wissen. Bauchgefühl. Ein ziemlich guter Abend."
          : "Neue Coins. Neue Plätze. Alles bleibt drin."}
      </p>
      {state.leaderboard.length ? (
        <Podium players={state.leaderboard} />
      ) : (
        <p>Noch niemand dabei.</p>
      )}
      <div className="runners-up">
        {state.leaderboard.slice(3, 5).map((player, index) => (
          <motion.div
            key={player.id}
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 2 + index * 0.15 }}
          >
            <span>#{index + 4}</span>
            <Avatar id={player.avatar} size="tiny" />
            <b>{player.name}</b>
            <strong>
              <AnimatedCoins amount={player.balance} /> ●
            </strong>
          </motion.div>
        ))}
      </div>
      <motion.span
        className="standings-footer"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 2.4 }}
      >
        {final ? "ZUSAMMEN MACHT’S BETOOT." : "Nächste Frage. Nächste Chance."}
      </motion.span>
    </motion.section>
  );
}
