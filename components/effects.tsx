"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getAvatar, avatars } from "@/lib/avatars";
import type { Player, Snapshot } from "@/lib/types";
import { money } from "@/lib/format";
export function Avatar({
  id,
  size = "medium",
  crowned = false,
}: {
  id?: string;
  size?: string;
  crowned?: boolean;
}) {
  const avatar = getAvatar(id);
  return (
    <span
      className={`game-avatar avatar-${size}`}
      style={{ "--avatar-color": avatar.color } as CSSProperties}
      aria-label={avatar.name}
    >
      {crowned && <span className="avatar-crown">👑</span>}
      <span className="avatar-emoji">{avatar.emoji}</span>
    </span>
  );
}
export function AvatarPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset className="avatar-fieldset">
      <legend>CHOOSE YOUR ALTER EGO</legend>
      <div className="avatar-picker">
        {avatars.map((avatar) => (
          <motion.button
            type="button"
            key={avatar.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.9 }}
            className={`avatar-choice ${selected === avatar.id ? "picked" : ""}`}
            aria-label={avatar.name}
            aria-pressed={selected === avatar.id}
            onClick={() => onSelect(avatar.id)}
          >
            <Avatar id={avatar.id} />
          </motion.button>
        ))}
      </div>
      <p className="avatar-name">
        {getAvatar(selected).name} <span>✦</span>
      </p>
    </fieldset>
  );
}
export function AnimatedCoins({ amount }: { amount: number }) {
  const [display, setDisplay] = useState(amount);
  const previous = useRef(amount);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      previous.current = amount;
      setDisplay(amount);
      return;
    }
    const from = previous.current;
    const started = performance.now();
    let frame = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - started) / 850);
      setDisplay(Math.round(from + (amount - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    previous.current = amount;
    return () => cancelAnimationFrame(frame);
  }, [amount, reduced]);
  return <span className="animated-coins">{money(display)}</span>;
}
export function Celebration({
  trigger,
  jackpot = false,
}: {
  trigger: string | undefined;
  jackpot?: boolean;
}) {
  const reduced = useReducedMotion();
  const fired = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!trigger || trigger === fired.current || reduced) return;
    fired.current = trigger;
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      void confetti({
        particleCount: jackpot ? 180 : 90,
        spread: 95,
        origin: { y: 0.65 },
        colors: ["#d7f75b", "#b89aff", "#ff8b93", "#82bcff", "#ffffff"],
        disableForReducedMotion: true,
        zIndex: 150,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [trigger, jackpot, reduced]);
  return null;
}
export function Podium({
  players,
  ownId,
}: {
  players: Player[];
  ownId?: string;
}) {
  const reduced = useReducedMotion();
  const top = [players[1], players[0], players[2]];
  return (
    <div className="podium" aria-label="Finales Podium">
      {top.map((player, column) => {
        if (!player) return <div key={column} className="podium-placeholder" />;
        const rank = column === 1 ? 1 : column === 0 ? 2 : 3;
        return (
          <motion.div
            key={player.id}
            className={`podium-place place-${rank} ${ownId === player.id ? "own-podium" : ""}`}
            initial={reduced ? false : { opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reduced ? 0 : rank === 1 ? 1.2 : rank === 2 ? 0.7 : 0.25,
              type: "spring",
              stiffness: 110,
              damping: 15,
            }}
          >
            <Avatar id={player.avatar} size="podium" crowned={rank === 1} />
            <b className="podium-name">{player.name}</b>
            <span className="podium-coins">
              <AnimatedCoins amount={player.balance} /> <small>●</small>
            </span>
            <div className="podium-block">
              <span>{rank === 1 ? "♛" : `0${rank}`}</span>
              <small>
                {rank === 1
                  ? "THE HIGH ROLLER"
                  : rank === 2
                    ? "SO CLOSE"
                    : "BIG MOVES"}
              </small>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
export function LobbyWall({ players }: { players: Player[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="lobby-wall">
      <AnimatePresence>
        {players.slice(-24).map((player) => (
          <motion.div
            key={player.id}
            layout
            initial={reduced ? false : { opacity: 0, scale: 0.2, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 230, damping: 15 }}
            className="lobby-person"
          >
            <Avatar id={player.avatar} />
            <span>{player.name}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
export function RoundTransition({ state }: { state: Snapshot }) {
  const phase =
    state.game.status === "finished" ? "finished" : state.round?.status;
  const key = `${state.round?.id}-${phase}`;
  const previous = useRef(key);
  const [splash, setSplash] = useState<string | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    const text =
      phase === "open"
        ? "PLACE YOUR BETS"
        : phase === "locked"
          ? "NO MORE BETS"
          : phase === "revealed"
            ? "THE REVEAL"
            : phase === "finished"
              ? "THE FINAL TABLE"
              : null;
    setSplash(text);
    const timer = setTimeout(() => setSplash(null), 1500);
    return () => clearTimeout(timer);
  }, [key, phase]);
  return (
    <AnimatePresence>
      {splash && !reduced && (
        <motion.div
          className="round-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 2, rotate: -6 }}
            animate={{ scale: 1, rotate: -3 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
          >
            <span>♠ ♦ ♣ ♥</span>
            <strong>{splash}</strong>
            <small>ALL HANDS CASINO</small>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export function ResultBanner({
  payout,
  stake,
}: {
  payout: number;
  stake: number;
}) {
  return (
    <motion.div
      className={`result-banner ${payout > 0 ? "win" : "lose"}`}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <span className="result-emoji">
        {payout > 0 ? (payout >= stake * 4 ? "💎" : "🤑") : "🫠"}
      </span>
      <span className="eyebrow">
        {payout > 0
          ? payout >= stake * 4
            ? "JACKPOT ENERGY"
            : "WINNER WINNER"
          : "THE COMEBACK STARTS NOW"}
      </span>
      <strong>
        {payout > 0 ? `+${money(payout)}` : `−${money(stake)}`}{" "}
        <small>COINS</small>
      </strong>
      <p>
        {payout > 0
          ? `Auszahlung inkl. Einsatz · ${money(payout - stake)} Coins netto`
          : "Nächste Runde. Neues Glück."}
      </p>
    </motion.div>
  );
}
