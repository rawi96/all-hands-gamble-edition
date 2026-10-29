"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, LogOut, LockKeyhole } from "lucide-react";
import { api, ErrorBox, Header } from "./shared";
type Game = { code: string; title: string; status: string; created_at: string };
export function HostHome({
  authenticated,
  initialGames,
}: {
  authenticated: boolean;
  initialGames: Game[];
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("All Hands · Casino Night");
  const [demo, setDemo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!authenticated) {
        await api("/api/host/login", { password });
        router.refresh();
      } else {
        const result = await api<{ code: string }>("/api/host/games", {
          title,
          demo,
        });
        router.push(`/host/${result.code}`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header>
        {authenticated && (
          <button
            className="button secondary small"
            onClick={async () => {
              await api("/api/host/logout", {});
              router.refresh();
            }}
          >
            <LogOut size={15} /> Abmelden
          </button>
        )}
      </Header>
      <main className="host-home">
        <div className="eyebrow">YOU RUN THE TABLE</div>
        <h1>
          {authenticated ? "Let’s host a good time." : "The house is yours."}
        </h1>
        <p className="muted">
          {authenticated
            ? "Neue Session starten oder an deinem nächsten All Hands weiterarbeiten."
            : "Melde dich mit dem konfigurierten Host-Passwort an."}
        </p>
        <ErrorBox error={error} />
        <div className="host-home-grid">
          <form className="panel form-panel" onSubmit={submit}>
            <h2>{authenticated ? "Neue Session" : "Host-Login"}</h2>
            {authenticated ? (
              <>
                <label htmlFor="title">Session-Titel</label>
                <input
                  id="title"
                  value={title}
                  minLength={3}
                  maxLength={100}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                />
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={demo}
                    onChange={(e) => setDemo(e.target.checked)}
                  />
                  <span>
                    Mit drei bearbeitbaren Demo-Fragen starten
                    <small>Enthält erfundene Zahlen und Antworten.</small>
                  </span>
                </label>
              </>
            ) : (
              <>
                <label htmlFor="password">Host-Passwort</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </>
            )}
            <button className="button full" disabled={busy}>
              {authenticated ? <Plus size={18} /> : <LockKeyhole size={18} />}{" "}
              {busy
                ? "Einen Moment …"
                : authenticated
                  ? "Session erstellen"
                  : "Anmelden"}
              <ArrowRight size={18} />
            </button>
          </form>
          {authenticated && (
            <section className="panel form-panel">
              <h2>Deine Sessions</h2>
              {initialGames.length ? (
                initialGames.map((game) => (
                  <Link
                    className="session-row"
                    href={`/host/${game.code}`}
                    key={game.code}
                  >
                    <div>
                      <b>{game.title}</b>
                      <small>
                        {game.code} ·{" "}
                        {new Date(game.created_at).toLocaleDateString("de-CH", {
                          timeZone: "Europe/Zurich",
                        })}
                      </small>
                    </div>
                    <span className="status-tag">
                      {game.status === "lobby"
                        ? "LOBBY"
                        : game.status === "finished"
                          ? "BEENDET"
                          : "LIVE"}
                    </span>
                    <ArrowRight size={18} />
                  </Link>
                ))
              ) : (
                <p className="muted">Dein erster Casino-Abend wartet.</p>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
