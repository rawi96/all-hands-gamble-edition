"use client";
export function GameAtmosphere() {
  return (
    <div className="game-atmosphere" aria-hidden="true">
      <span className="shape shape-triangle">▲</span>
      <span className="shape shape-diamond">◆</span>
      <span className="shape shape-circle">●</span>
      <span className="shape shape-cross">✦</span>
      <span className="shape shape-star">✧</span>
    </div>
  );
}
export function RoundProgress({
  seconds,
  duration,
  running,
}: {
  seconds: number;
  duration: number;
  running: boolean;
}) {
  const remaining = Math.max(0, Math.min(duration, seconds));
  return (
    <div
      className={`round-progress ${remaining <= 10 && running ? "progress-urgent" : ""}`}
      role="progressbar"
      aria-label="Verbleibende Wettzeit"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={running ? remaining : 0}
    >
      <span
        style={{ transform: `scaleX(${running ? remaining / duration : 0})` }}
      />
    </div>
  );
}
