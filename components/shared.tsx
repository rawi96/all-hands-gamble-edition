"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Coins, Radio, Crown, Volume2, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Avatar, AnimatedCoins } from "./effects";
import { money } from "@/lib/format";
export { money } from "@/lib/format";
import type { Snapshot } from "@/lib/types";

export async function api<T = { ok: boolean }>(
  url: string,
  data?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method: data === undefined ? "GET" : "POST",
    cache: "no-store",
    ...(data === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Verbindung fehlgeschlagen.");
  return result;
}
export function useGame(code: string, host = false) {
  const [state, setState] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const mounted = useRef(true);
  const refresh = useCallback(async () => {
    try {
      const started = Date.now();
      const result = await api<Snapshot>(
        `/api/games/${encodeURIComponent(code)}${host ? "?host=1" : ""}`,
      );
      if (mounted.current) {
        setState(result);
        setOffset(result.serverTime - (started + Date.now()) / 2);
        setError("");
      }
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    }
  }, [code, host]);
  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function tick() {
      await refresh();
      if (!cancelled) timer = setTimeout(tick, document.hidden ? 5000 : 1800);
    }
    void tick();
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);
  return { state, error, refresh, offset };
}
export function useCountdown(
  closesAt: string | null | undefined,
  offset: number,
) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  return closesAt && now
    ? Math.max(
        0,
        Math.ceil((new Date(closesAt).getTime() - now - offset) / 1000),
      )
    : 0;
}
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark">
        <Coins size={21} />
      </span>
      ALL HANDS<span className="brand-sub">CASINO</span>
    </Link>
  );
}
export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="header">
      <Brand />
      <div className="header-actions">{children}</div>
    </header>
  );
}
export function Live({ label = "LIVE SESSION" }: { label?: string }) {
  return (
    <span className="live">
      <Radio size={13} />
      {label}
    </span>
  );
}
export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <div className="error" role="alert">
      {error}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="empty">
      <span className="spinner" /> Verbindung zum Spiel …
    </div>
  );
}
export function Leaderboard({
  state,
  limit = 8,
}: {
  state: Snapshot;
  limit?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <section className="panel leaderboard">
      <div className="section-label">
        <Crown size={16} /> LEADERBOARD <span>{state.playerCount} Players</span>
      </div>
      {!state.playerCount && (
        <div className="empty">Die ersten High Roller sind gleich da.</div>
      )}
      {state.leaderboard.slice(0, limit).map((player, index) => (
        <motion.div
          layout={!reduced}
          initial={false}
          transition={{ type: "spring", stiffness: 220, damping: 25 }}
          className={`leader-row ${player.id === state.me?.id ? "is-me" : ""}`}
          key={player.id}
        >
          <span className="rank">
            {index === 0 ? "♛" : String(index + 1).padStart(2, "0")}
          </span>
          <Avatar id={player.avatar} size="small" />
          <span className="player-name">
            {player.name}
            {player.id === state.me?.id && <small> DU</small>}
          </span>
          <strong>
            <AnimatedCoins amount={player.balance} />{" "}
            <span className="coin-small">●</span>
          </strong>
        </motion.div>
      ))}
      <p className="fine">
        Kontostand nach gebuchten Einsätzen · Gleichstand: alphabetisch.
      </p>
    </section>
  );
}
export function SoundToggle({ revealKey }: { revealKey?: string }) {
  const [enabled, setEnabled] = useState(false);
  const context = useRef<AudioContext | null>(null);
  const last = useRef(revealKey);
  function play() {
    const ctx = context.current;
    if (!ctx) return;
    void ctx.resume();
    [523.25, 659.25, 783.99, 1046.5].forEach((hz, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + index * 0.12;
      osc.frequency.value = hz;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.07, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  }
  useEffect(() => {
    if (last.current !== revealKey && revealKey && enabled) play();
    last.current = revealKey;
  }, [revealKey, enabled]); // Sound is local to this display.
  useEffect(
    () => () => {
      void context.current?.close();
    },
    [],
  );
  return (
    <button
      className="icon-button"
      aria-label={enabled ? "Sound ausschalten" : "Sound einschalten"}
      onClick={() => {
        if (!context.current) context.current = new AudioContext();
        void context.current.resume();
        setEnabled(!enabled);
      }}
    >
      {enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
    </button>
  );
}
