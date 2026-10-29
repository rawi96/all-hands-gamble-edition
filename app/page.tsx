"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Sparkles,
  Smartphone,
  Monitor,
  LockKeyhole,
} from "lucide-react";
import { Header } from "@/components/shared";
export default function Home() {
  const [code, setCode] = useState("");
  const router = useRouter();
  function join(e: FormEvent) {
    e.preventDefault();
    if (code.trim().length === 6)
      router.push(`/play/${code.trim().toUpperCase()}`);
  }
  return (
    <>
      <Header>
        <span className="desktop-only muted">THE MEETING IS THE GAME.</span>
        <Link className="button secondary small" href="/host">
          <LockKeyhole size={14} /> Host-Bereich
        </Link>
      </Header>
      <main className="landing">
        <section className="hero">
          <div className="eyebrow">
            <span className="dot" /> YOUR NEXT ALL HANDS, UPGRADED.
          </div>
          <h1>
            HIGH STAKES.
            <br />
            <span>ALL HANDS.</span>
          </h1>
          <p className="hero-copy">
            Die Zahlen kommen gleich.
            <br />
            Dein Einsatz kommt zuerst.
          </p>
          <p className="muted hero-detail">
            Wette auf die nächsten Reveals, riskiere deine Coins und klettere an
            die Spitze. Gemeinsam im Büro. Gemeinsam remote.
          </p>
          <form className="join-box" onSubmit={join}>
            <label htmlFor="code">DEIN PLATZ AM TISCH</label>
            <div className="join-input">
              <input
                id="code"
                aria-label="Sechsstelliger Spielcode"
                autoComplete="off"
                placeholder="SPIELCODE"
                value={code}
                maxLength={6}
                minLength={6}
                pattern="[A-Za-z2-9]{6}"
                required
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""),
                  )
                }
              />
              <button className="button" disabled={code.length !== 6}>
                Let’s play <ArrowRight size={18} />
              </button>
            </div>
            <small>Kein Account. Kein Download. Nur virtuelle Coins.</small>
          </form>
        </section>
        <section
          className="hero-art"
          aria-label="Vorschau einer Casino-Spielrunde"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-chip chip-top">1K</div>
          <div className="floating-chip chip-bottom">
            ALL
            <br />
            IN
          </div>
          <div className="preview-card">
            <div className="preview-top">
              <span className="live">
                <span className="dot" /> DEMO ROUND
              </span>
              <span className="muted">01 / 08</span>
            </div>
            <div className="preview-pot">
              <Coins size={20} /> 1’000 <small>STARTING COINS</small>
            </div>
            <h2>
              Wie viele Deployments
              <br />
              waren’s dieses Quartal?
            </h2>
            <div className="preview-option">
              <span>A &nbsp; Unter 100</span>
              <b>× 4.0</b>
            </div>
            <div className="preview-option selected">
              <span>B &nbsp; 100 bis 250</span>
              <b>× 2.0</b>
            </div>
            <div className="preview-option">
              <span>C &nbsp; Über 250</span>
              <b>× 3.0</b>
            </div>
            <div className="preview-bottom">
              <span>DEIN EINSATZ</span>
              <strong>
                250 <span>●</span>
              </strong>
            </div>
            <div className="preview-ticket">
              <Sparkles size={16} /> NORMAL MEETING. UNNORMAL SPANNEND.
            </div>
          </div>
          <span className="art-caption">
            VIRTUAL MONEY. REAL BRAGGING RIGHTS.
          </span>
        </section>
      </main>
      <section className="how-it-works">
        <div>
          <Smartphone />
          <span>
            <b>01 / JOIN THE TABLE</b>
            <p>QR scannen oder Spielcode eingeben.</p>
          </span>
        </div>
        <div>
          <Coins />
          <span>
            <b>02 / PLACE YOUR BET</b>
            <p>1’000 Coins. Deine Antwort. Dein Risiko.</p>
          </span>
        </div>
        <div>
          <Monitor />
          <span>
            <b>03 / WATCH THE REVEAL</b>
            <p>Beim Update mitfiebern. Gewinne kassieren.</p>
          </span>
        </div>
      </section>
      <footer>
        ALL HANDS CASINO{" "}
        <span>Nur Spielgeld. Keine Käufe. Keine Auszahlungen.</span>
      </footer>
    </>
  );
}
