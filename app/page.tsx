"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Sparkles,
  Users,
  Smartphone,
  Check,
  Play,
  Zap,
  Heart,
  GraduationCap,
  PartyPopper,
} from "lucide-react";
import { Brand, BetootMark } from "@/components/brand";
export default function Home() {
  const [code, setCode] = useState("");
  const router = useRouter();
  function join(event: FormEvent) {
    event.preventDefault();
    if (code.length === 6) router.push(`/play/${code}`);
  }
  return (
    <div className="betoot-landing">
      <nav className="landing-nav">
        <Brand />
        <div>
          <a href="#so-gehts" className="nav-how">
            So funktioniert’s
          </a>
          <Link className="button secondary small" href="/host">
            Spiel erstellen <Plus size={15} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="betoot-hero">
          <div className="hero-message">
            <span className="betoot-eyebrow">
              <span /> WISSEN TRIFFT BAUCHGEFÜHL.
            </span>
            <h1>
              Wissen trifft
              <br />
              <em>Bauchkribbeln.</em>
            </h1>
            <p>
              Gute Fragen. Mutige Einsätze. Grosse Aha-Momente. Mach aus deiner
              Gruppe eine Spielshow – mit Betoot.
            </p>
            <div className="entry-actions">
              <form className="entry-card join-entry" onSubmit={join}>
                <div className="entry-card-top">
                  <span className="entry-icon">
                    <Users size={19} />
                  </span>
                  <h2>Du spielst mit?</h2>
                </div>
                <label htmlFor="join-code">Gib deinen Spielcode ein</label>
                <div className="entry-code-row">
                  <input
                    id="join-code"
                    value={code}
                    onChange={(e) =>
                      setCode(
                        e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""),
                      )
                    }
                    placeholder="ABC234"
                    autoComplete="off"
                    autoCapitalize="characters"
                    maxLength={6}
                    minLength={6}
                    pattern="[A-Z2-9]{6}"
                    required
                    aria-label="Sechsstelliger Spielcode"
                  />
                  <button
                    className="button"
                    disabled={code.length !== 6}
                    aria-label="Spiel beitreten"
                  >
                    <ArrowRight size={22} />
                  </button>
                </div>
              </form>
              <div className="entry-card create-entry">
                <div className="entry-card-top">
                  <span className="entry-icon">
                    <Sparkles size={19} />
                  </span>
                  <h2>Du gibst den Ton an?</h2>
                </div>
                <p>Deine Fragen. Eure Spielshow.</p>
                <Link href="/host" className="button full">
                  Spiel erstellen <Plus size={18} />
                </Link>
              </div>
            </div>
            <div className="hero-promises">
              <span>
                <Check size={14} /> Ohne Anmeldung
              </span>
              <span>
                <Check size={14} /> Auf jedem Gerät
              </span>
              <span>
                <Check size={14} /> Vor Ort & remote
              </span>
            </div>
          </div>
          <div className="betoot-hero-art" aria-hidden="true">
            <span className="art-orbit orbit-1" />
            <span className="art-orbit orbit-2" />
            <span className="hero-star star-1">✦</span>
            <span className="hero-star star-2">✧</span>
            <div className="floating-avatar avatar-float-a">🦊</div>
            <div className="floating-avatar avatar-float-b">👾</div>
            <div className="hero-game-card">
              <div className="hero-game-top">
                <span>
                  <i /> BETOOT LIVE
                </span>
                <span>01 / 08</span>
              </div>
              <div className="hero-mini-question">
                Wie viele Minuten
                <br />
                hat ein Tag?
              </div>
              <div className="hero-answer answer-pink">
                <b>A</b>
                <span>720 Minuten</span>
                <strong>× 4</strong>
              </div>
              <div className="hero-answer answer-blue">
                <b>B</b>
                <span>1’440 Minuten</span>
                <strong>× 2</strong>
                <span className="mini-selection">✓</span>
              </div>
              <div className="hero-answer answer-mint">
                <b>C</b>
                <span>2’880 Minuten</span>
                <strong>× 3</strong>
              </div>
              <div className="hero-demo-stake">
                <span>DEIN EINSATZ</span>
                <strong>
                  250 <i>●</i>
                </strong>
              </div>
              <div className="hero-demo-button">
                Antwort steht. Spannung steigt. <Zap size={16} />
              </div>
            </div>
            <div className="hero-pop-toast">
              <span>🦄</span>
              <div>
                <b>Lina ist dabei!</b>
                <small>Die Runde wird immer besser.</small>
              </div>
              <Heart size={16} />
            </div>
            <div className="hero-sticker">
              <BetootMark />
              <span>
                Kein Konto.
                <br />
                Nur gute Runden.
              </span>
            </div>
          </div>
        </section>
        <section className="betoot-use-cases">
          <span>FÜR ALLES, WAS ZUSAMMEN MEHR SPASS MACHT.</span>
          <div>
            <p>
              <Users size={17} /> Teamrunden
            </p>
            <p>
              <PartyPopper size={17} /> Partys & Spieleabende
            </p>
            <p>
              <GraduationCap size={18} /> Unterricht
            </p>
            <p>
              <Sparkles size={17} /> Workshops
            </p>
          </div>
        </section>
        <section id="so-gehts" className="betoot-how">
          <span className="betoot-eyebrow">
            WENIG AUFWAND. VIEL „NOCH EINE RUNDE!“
          </span>
          <h2>
            Ein Code.
            <br />
            <em>Alle drin.</em>
          </h2>
          <div className="how-cards">
            <article>
              <span className="how-number">01</span>
              <div className="how-icon icon-orange">
                <Sparkles />
              </div>
              <h3>Du machst die Runde.</h3>
              <p>
                Spiel erstellen, Fragen eintragen und richtige Antworten
                festlegen. Oder erst mal mit unseren Beispielen loslegen.
              </p>
            </article>
            <article>
              <span className="how-number">02</span>
              <div className="how-icon icon-blue">
                <Smartphone />
              </div>
              <h3>Alle sind dabei.</h3>
              <p>
                Code eingeben, Avatar wählen, fertig. Das Handy wird zum
                Controller. Auch von der Couch am anderen Ende der Welt.
              </p>
            </article>
            <article>
              <span className="how-number">03</span>
              <div className="how-icon icon-mint">
                <Zap />
              </div>
              <h3>Jetzt wird mitgefiebert.</h3>
              <p>
                Antwort wählen, virtuelle Coins setzen und gemeinsam die
                Auflösung feiern. Wer landet auf dem Podium?
              </p>
            </article>
          </div>
        </section>
        <section className="betoot-bottom-cta">
          <div>
            <span className="betoot-eyebrow">
              DIE NÄCHSTE GUTE RUNDE WARTET.
            </span>
            <h2>Na, wer traut sich?</h2>
            <p>Keine Anmeldung. Keine Downloads. Einfach zusammen spielen.</p>
          </div>
          <Link href="/host" className="button">
            Dein erstes Spiel erstellen <ArrowRight size={19} />
          </Link>
          <BetootMark />
        </section>
      </main>
      <footer className="betoot-footer">
        <Brand />
        <p>Gute Fragen verbinden.</p>
        <span>Nur virtuelle Coins. Kein Echtgeld.</span>
      </footer>
    </div>
  );
}
