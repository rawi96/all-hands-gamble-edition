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
