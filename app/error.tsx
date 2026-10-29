"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="player-shell">
      <h1>Kurze Spielpause.</h1>
      <p>
        Die Seite konnte nicht geladen werden. Prüfe die Server-Konfiguration
        und versuche es erneut.
      </p>
      <button className="button" onClick={reset}>
        Erneut versuchen
      </button>
    </main>
  );
}
