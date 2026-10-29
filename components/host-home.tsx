"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Sparkles,
  Clock3,
  Check,
  ArrowLeft,
} from "lucide-react";
import { api, ErrorBox, Header } from "./shared";
import { BetootMark } from "./brand";
type Game = { code: string; title: string; status: string; created_at: string };
export function HostHome({ initialGames }: { initialGames: Game[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("Meine Quizrunde");
  const [demo, setDemo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ code: string }>("/api/host/games", {
        title,
        demo,
      });
      router.push(`/host/${result.code}?prepare=1`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="creator-page">
      <Header>
        <Link className="button secondary small" href="/">
          <ArrowLeft size={15} /> Zur Startseite
        </Link>
      </Header>
      <main className="creator-layout">
        <section className="creator-intro">
          <span className="betoot-eyebrow">DEINE IDEE. EURE RUNDE.</span>
          <h1>
            Du hast die Fragen.
            <br />
            <em>Wir den Rest.</em>
          </h1>
          <p>
            Ein Name, ein paar gute Fragen und schon wird aus deiner Gruppe eine
            Spielshow.
          </p>
          <div className="creator-checks">
            <span>
              <Check /> Kein Konto anlegen
            </span>
            <span>
              <Check /> Eigene Fragen & Antworten
            </span>
            <span>
              <Check /> Mit einem Code alle dabei
            </span>
          </div>
          <div className="creator-mascot">
            <BetootMark />
            <span>Na, wer weiss es?</span>
          </div>
        </section>
        <section className="creator-workspace">
          <ErrorBox error={error} />
          <form className="panel create-game-form" onSubmit={submit}>
            <div className="create-form-icon">
              <Sparkles size={25} />
            </div>
            <h2>Dein neues Spiel</h2>
            <p>Für die nächste gute Runde.</p>
            <label htmlFor="game-title">Wie heisst dein Spiel?</label>
            <input
              id="game-title"
              required
              minLength={3}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Zum Beispiel: Das grosse Filmquiz"
            />
            <label className="checkbox demo-checkbox">
              <input
                type="checkbox"
                checked={demo}
                onChange={(e) => setDemo(e.target.checked)}
              />
              <span>
                Mit Beispielfragen starten
                <small>
                  Drei Fragen zum Ausprobieren. Du kannst alles ändern.
                </small>
              </span>
            </label>
            <button className="button full" disabled={busy}>
              <Plus size={18} />
              {busy ? "Deine Runde entsteht …" : "Spiel erstellen"}
              <ArrowRight size={18} />
            </button>
            <p className="fine">
              Deine Spiele bleiben in diesem Browser verfügbar. Erstelle sie auf
              dem Gerät, mit dem du präsentieren möchtest.
            </p>
          </form>
          {initialGames.length > 0 && (
            <section className="panel my-games">
              <div className="list-heading">
                <h2>Deine Spiele</h2>
                <Clock3 size={18} />
              </div>
              {initialGames.map((game) => (
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
                      ? "BEREIT"
                      : game.status === "finished"
                        ? "BEENDET"
                        : "LIVE"}
                  </span>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
