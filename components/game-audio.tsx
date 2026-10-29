"use client";
import { useEffect, useRef, useState } from "react";
import { Music2, Volume2, VolumeX } from "lucide-react";
import {
  bettingPattern,
  cueTones,
  lobbyPattern,
  type SoundCue,
  type Tone,
} from "@/lib/game-sounds";
import type { Snapshot } from "@/lib/types";

type AudioEngine = { context: AudioContext; master: GainNode };
export function GameAudio({
  state,
  seconds,
  role = "host",
}: {
  state: Snapshot | null;
  seconds: number;
  role?: "host" | "player";
}) {
  const engine = useRef<AudioEngine | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [music, setMusic] = useState(true);
  const [error, setError] = useState("");
  const last = useRef({
    phase: "",
    tick: "",
    players: 0,
    bets: 0,
    ownBet: "",
    result: "",
  });
  const round = state?.round;
  const phase = !state
    ? "loading"
    : state.game.status === "finished"
      ? "podium"
      : !round
        ? "lobby"
        : round.status === "open" && seconds <= 0
          ? "locked"
          : round.status;

  function tones(notes: Tone[]) {
    const audio = engine.current;
    if (!audio || audio.context.state !== "running" || document.hidden) return;
    const start = audio.context.currentTime;
    for (const note of notes) {
      const osc = audio.context.createOscillator();
      const gain = audio.context.createGain();
      osc.type = note.wave || "sine";
      osc.frequency.value = note.hz;
      osc.connect(gain);
      gain.connect(audio.master);
      gain.gain.setValueAtTime(0, start + note.at);
      gain.gain.linearRampToValueAtTime(
        note.volume ?? 0.085,
        start + note.at + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + note.at + note.duration,
      );
      osc.start(start + note.at);
      osc.stop(start + note.at + note.duration + 0.01);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
  }
  function cue(value: SoundCue, urgency = 0) {
    tones(cueTones(value, urgency));
  }
  async function toggle() {
    setError("");
    if (enabled) {
      setEnabled(false);
      await engine.current?.context.suspend();
      return;
    }
    try {
      if (!engine.current) {
        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = 0.38;
        master.connect(context.destination);
        engine.current = { context, master };
      }
      await engine.current.context.resume();
      setEnabled(true);
      cue("join");
    } catch {
      setError("Audio ist in diesem Browser nicht verfügbar.");
    }
  }
  useEffect(() => {
    const visible = () => {
      const audio = engine.current;
      if (audio)
        audio.master.gain.setTargetAtTime(
          document.hidden ? 0 : 0.38,
          audio.context.currentTime,
          0.04,
        );
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      void engine.current?.context.close();
    };
  }, []);
  useEffect(() => {
    if (!state) return;
    const key = `${round?.id || "session"}:${phase}`;
    const betKey = state.bet ? `${state.bet.round_id}:${state.bet.stake}` : "";
    const resultKey = round?.status === "revealed" && state.bet ? round.id : "";
    const previous = last.current;
    if (enabled) {
      if (previous.phase && previous.phase !== key) {
        if (phase === "podium") cue("podium");
        else if (role === "host" && phase === "open") cue("open");
        else if (role === "host" && phase === "locked") cue("lock");
        else if (role === "host" && phase === "revealed") cue("reveal");
      }
      if (
        role === "host" &&
        phase === "lobby" &&
        state.playerCount > previous.players &&
        previous.phase
      )
        cue("join");
      if (
        role === "host" &&
        phase === "open" &&
        state.betCount > previous.bets &&
        previous.phase === key
      )
        cue("chip");
      if (role === "player" && betKey && previous.ownBet !== betKey)
        cue("chip");
      if (role === "player" && resultKey && previous.result !== resultKey)
        cue(state.bet!.payout ? "win" : "loss");
      const tickKey = `${round?.id}:${seconds}`;
      if (
        role === "host" &&
        phase === "open" &&
        seconds > 0 &&
        seconds <= 10 &&
        previous.tick !== tickKey
      )
        cue("tick", 11 - seconds);
      previous.tick = tickKey;
    }
    previous.phase = key;
    previous.players = state.playerCount;
    previous.bets = state.betCount;
    previous.ownBet = betKey;
    previous.result = resultKey;
  }, [state, phase, round?.id, enabled, role, seconds]);
  useEffect(() => {
    if (
      !enabled ||
      !music ||
      role !== "host" ||
      (phase !== "lobby" && phase !== "open")
    )
      return;
    let beat = 0;
    const pattern = phase === "lobby" ? lobbyPattern : bettingPattern;
    const interval = setInterval(
      () => {
        const hz = pattern[beat++ % pattern.length];
        if (hz)
          tones([
            {
              hz,
              at: 0,
              duration: 0.16,
              volume: phase === "lobby" ? 0.025 : 0.033,
              wave: "triangle",
            },
          ]);
      },
      phase === "lobby" ? 240 : 185,
    );
    return () => clearInterval(interval);
  }, [enabled, music, role, phase]);
  return (
    <div className="audio-controls">
      <button
        className={`sound-button ${enabled ? "sound-on" : ""}`}
        aria-label={enabled ? "Sound ausschalten" : "Sound einschalten"}
        aria-pressed={enabled}
        title={error || "Originale Spielsounds aktivieren"}
        onClick={() => void toggle()}
      >
        {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        <span>Sound</span>
        {enabled && (
          <span className="equalizer" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </button>
      {role === "host" && enabled && (
        <button
          className={`icon-button music-button ${music ? "sound-on" : ""}`}
          aria-label={music ? "Musik ausschalten" : "Musik einschalten"}
          aria-pressed={music}
          onClick={() => setMusic(!music)}
        >
          <Music2 size={17} />
        </button>
      )}
      {error && (
        <span className="audio-error" role="status">
          {error}
        </span>
      )}
    </div>
  );
}
