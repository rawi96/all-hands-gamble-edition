import Link from "next/link";
export default function NotFound() {
  return (
    <main className="player-shell">
      <h1>Dieser Tisch existiert nicht.</h1>
      <Link className="button" href="/">
        Zur Startseite
      </Link>
    </main>
  );
}
