# All Hands Casino 🎰

Ein hybrides All-Hands-Spiel mit Next.js, React und PostgreSQL. Alle starten mit **1’000 virtuellen Coins**, wählen einen Avatar und wetten auf Fragen, die während der Präsentation aufgelöst werden.

**Nur Spielgeld:** keine Käufe, Echtgeldzahlungen oder auszahlbaren Gewinne.

## Was drin ist

- **12 Avatare** mit animierter Auswahl und sichtbarer Lobby-Crew.
- **Player am Handy:** Antworten, feste Quoten, Einsätze von 50/100/250 oder All-in, animierter Kontostand und persönliche Gewinnanzeige.
- **Host = Bühne + Steuerung:** QR-Code, Join-Code, Countdown, farbige Antwortkarten, Rundenübergänge, Konfetti, optionaler Reveal-Sound und Vollbild. Alles in einem Tab mit kompakter Steuerleiste.
- **Private Vorbereitung:** Auf derselben Host-Seite zwischen „Live-Spiel“ und „Vorbereitung (privat)“ wechseln. Fragen hinzufügen/bearbeiten/löschen und Lösungen festlegen. Im Live-Spiel sind keine zukünftigen Fragen oder unrevealten Lösungen sichtbar.
- **Finale:** animiertes Top-3-Podium mit Avataren, Krone und Rangliste.
- **Reconnect:** Spieleridentität in einem HttpOnly-Cookie, Spielzustand dauerhaft in PostgreSQL. Ein Reload verliert den Einsatz nicht.
- Drei klar als erfunden markierte Demo-Fragen, vor dem Einsatz bearbeiten.
- Responsive Oberfläche, Tastaturbedienung, Fokussteuerung im Editor und Unterstützung für reduzierte Bewegung.

## Lokal starten

Voraussetzungen: **Node.js 22.13+** und **Docker Compose** oder eine bestehende PostgreSQL-Datenbank.

```bash
npm ci
cp .env.example .env.local
docker compose up -d
```

In `.env.local` setzen:

```dotenv
DATABASE_URL=postgresql://casino:casino@localhost:5432/casino
HOST_PASSWORD=dein-eigenes-langes-host-passwort
AUTH_SECRET=dein-separates-zufaelliges-geheimnis-mit-mindestens-32-zeichen
```

Ein Secret kannst du mit `openssl rand -hex 32` erstellen. Host-Passwort mindestens 12 Zeichen. Niemals `.env.local` committen.

```bash
npm run db:migrate
npm run dev
```

Öffne `http://localhost:3000/host`, melde dich mit `HOST_PASSWORD` an und erstelle eine Session.

## Vercel + PostgreSQL

1. Repository auf GitHub anlegen und den Quellcode pushen (siehe unten).
2. In Vercel das Repository als Next.js-Projekt importieren.
3. PostgreSQL bereitstellen, beispielsweise Neon. Den **gepoolten** Connection-String als `DATABASE_URL` in Vercel hinterlegen. Die vom Anbieter verlangten SSL-Parameter beibehalten.
4. `HOST_PASSWORD` und `AUTH_SECRET` ebenfalls als Environment Variables setzen. Ein starkes, separates Secret für jede Umgebung verwenden.
5. Die erste Migration **einmal bewusst** gegen die Ziel-Datenbank ausführen. Dazu lokal deren Connection-String als `MIGRATION_DATABASE_URL` in `.env.local` setzen und `npm run db:migrate` starten. Für Migrationen ist ein direkter Connection-String sinnvoll.
6. Deployen. Build Command: `npm run build`. Das Schema wird beim Build absichtlich nicht verändert.
7. `/host` öffnen und eine Testsession durchspielen.

Für Preview/Staging eine separate Datenbank verwenden. Keine Production-Verbindung in unkontrollierte Preview-Deployments übernehmen. Keine zusätzlichen Dienste oder WebSocket-Server erforderlich.

**Noch kein GitHub-Repository?** Nach dem Entpacken im Projektordner mit angemeldeter GitHub CLI:

```bash
git init -b main
git add .
git commit -m "Build All Hands Casino"
gh repo create all-hands-casino --private --source=. --remote=origin --push
```

Alternativ ein leeres Repository in GitHub erstellen, dessen Remote hinzufügen und pushen.

## Nur zwei Ansichten: Host und Teilnehmer

| Rolle          | URL            | Verwendung                                                                          |
| -------------- | -------------- | ----------------------------------------------------------------------------------- |
| **Host**       | `/host/ABC234` | Präsentation und Steuerung in einer Ansicht, direkt auf Beamer und im Screensharing |
| **Teilnehmer** | `/play/ABC234` | Antworten und Coins auf dem Handy oder in einem Browserfenster                      |

`/host` ist die Session-Übersicht vor dem Spiel. `ABC234` durch den generierten Code ersetzen. Alte `/screen/ABC234`-Bookmarks leiten auf die Host-Seite weiter; eine separate Beamer-Ansicht gibt es nicht mehr.

### Vor dem Meeting

1. Session erstellen und auf derselben Seite **Vorbereitung (privat)** öffnen.
2. Fragen, Quoten, richtige Antworten und Auflösungen vorbereiten.
3. Auf **Live-Spiel** wechseln. Erst dann die Host-Seite auf Beamer und im Meeting teilen. Der Vorbereitungsmodus zeigt Lösungen und kommende Fragen – diesen Modus nicht teilen.
4. Alle scannen den QR-Code und wählen ihren Avatar. Für Sound den Lautsprecher-Button einmal aktivieren; optional Vollbild einschalten.

### Während des Meetings

1. **Erste Wette öffnen**: Die Frage erscheint auf der Host-Bühne und allen Handys.
2. **Wetten schliessen** oder den Countdown abwarten.
3. Zu Slides wechseln oder jemand anderem das Screensharing überlassen. Die Einsätze bleiben gespeichert.
4. Zur selben Host-Seite zurückkehren und **Auflösen & auszahlen** klicken.
5. **Nächste Wette öffnen**, wenn das nächste Thema beginnt. Der Button verrät die kommende Frage noch nicht.
6. Nach der letzten Wette **Finale starten**: animiertes Podium und finale Rangliste. Über **Zum Finale** können ungespielte Fragen nach Bestätigung übersprungen werden.

Du brauchst weder ein zweites Display noch ein separates Control Panel. Auf der geteilten Live-Seite bleiben Lösungen bis zum Reveal verborgen. Wer die Host-Seite bedient, muss als Host angemeldet sein; Teilnehmer benötigen keinen Account.

Remote-Spieler:innen werden nicht nach Geschwindigkeit bewertet. 45–60 Sekunden Wettfenster sind ein guter Start. Beim Testen mehrerer Spieler auf demselben Rechner getrennte Browserprofile verwenden: Tabs desselben Profils teilen die Spieleridentität.

## Spielregeln

- Startguthaben: **1’000 Coins**; ein verbindlicher Einsatz je Person und Runde.
- Keine nachträglichen Änderungen von Einsätzen; ein Doppelklick zieht nicht doppelt ab.
- Die Quote enthält den Einsatz: **100 × 3.0 = 300 Coins Auszahlung**, also 200 netto.
- Quoten zwischen × 1.1 und × 20.0 in Schritten von 0.1; maximal vier Antworten.
- Auszahlung auf ganze Coins abrunden. Sicherheitsobergrenze für den Kontostand: **1 Milliarde Coins**; darüber wird die Gutschrift begrenzt.
- Fristen werden von der Datenbank geprüft. Nach Ablauf sind Wetten geschlossen, auch wenn der Host gerade eine Demo zeigt.
- Gewinne werden erst beim manuellen Reveal gutgeschrieben. Wiederholtes Reveal zahlt nicht doppelt aus.
- Bei **0 Coins** gibt es einmalig **300 Bailout-Coins**, sobald keine eigene Wette mehr aussteht.
- Rangliste nach aktuell verfügbarem Guthaben; offene Einsätze sind bereits abgezogen. Bei Gleichstand alphabetisch.
- Teilnahme auch während des Spiels möglich, solange die Session nicht beendet ist.

## Architektur

- **Next.js App Router + TypeScript + React**
- **PostgreSQL + node-postgres (`pg`)**, SQL-Migrationen mit Versions-Tabelle und Migration-Lock
- **Motion** für Listen und Podium; CSS für Countdown, Glow und Schwebe-Effekte; `canvas-confetti` wird erst bei einer Feier geladen
- **Polling**: rund alle 1.8 Sekunden nach Abschluss der letzten Abfrage, in versteckten Tabs 5 Sekunden. Keine überlappende Polling-Schleife. Countdown wird auf die Serverzeit abgeglichen.
- Alle Spiel-Mutationen verwenden eine Transaktion und sperren zuerst die Sessionzeile (`SELECT ... FOR UPDATE`). Dadurch werden Einsätze, Fristen, Kontostände und Reveal-Buchungen pro Session serialisiert.
- Öffentliche Snapshots verwenden eine geteilte Session-Sperre für einen konsistenten Zustand. Sie enthalten vor dem Reveal keine Lösung, keine zukünftigen Fragen und niemals Spieler-Token.
- Antworten und Spielkonten liegen in PostgreSQL. Auth-Token liegen nur gehasht in der Datenbank; Spieler-Cookies sind HttpOnly, SameSite=Lax und unter HTTPS Secure.
- Host-Login über ein gemeinsames Environment-Passwort, 12 Stunden signiertes Cookie, serverseitige Host-Prüfung bei jeder Aktion; Login-Limit 10 Versuche pro IP und 15-Minuten-Fenster. Neustart eines Spiels umgeht dieses Limit nicht.
- Schreibende Endpunkte prüfen den Origin. Keine personenbezogenen Analytics oder extern geladenen Schriften/Bilder.

Das ist für einen moderierten internen Event gedacht, kein Multi-Tenant-Produkt: alle Hosts mit dem gemeinsamen Passwort sehen alle Sessions. Spielcode und Teilnahme-Link nur an die Teilnehmenden verteilen. Ohne Mitarbeiter-Login kann eine Person über mehrere Browserprofile mehrfach teilnehmen. Spieler-Namen sind Nicknames und keine verifizierten Identitäten.

**Kapazität:** Die Software begrenzt eine Session auf 300 Plätze und 50 Fragen. Das ist eine Eingabegrenze, keine gemessene Zusage für 300 gleichzeitige Spieler. Vor dem echten Event mit eurer erwarteten Gruppengrösse auf der tatsächlichen Vercel-/Datenbank-Konfiguration testen. Polling verursacht entsprechend Requests und Datenbankzugriffe.

## Tests & Checks

```bash
npm test
npm run build
npm run typecheck
```

Die Tests nutzen **PGlite**, eine eingebettete PostgreSQL-Engine, und brauchen keine externe Datenbank. Sie prüfen den Ablauf, geheime Lösungen, Deadline-Verhalten, Guthaben, doppelte Einsätze, wiederholtes Reveal, Bailouts und Session-Isolation mit echtem SQL. Zusätzliche Render-Tests prüfen, dass die geteilte Host-Bühne keine kommenden Fragen oder geheimen Auflösungen vorwegnimmt. PGlite hat eine einzelne Verbindung; der Testadapter serialisiert diese. Der Lock-Mechanismus unter mehreren echten PostgreSQL-Verbindungen ist damit nicht als Lasttest verifiziert.

CI führt Tests und Production-Build aus. Der Build braucht keine Datenbank-Verbindung.

## Nächste sinnvolle Erweiterungen

- Fragen als JSON importieren/exportieren
- Finalrunde mit frei eingebbarem Einsatz
- Teammodus und mehr Show-Sounds
- Mitarbeiter-SSO und getrennte Host-Berechtigungen, wenn es über interne Events hinausgeht

Diese Erweiterungen sind nicht Bestandteil dieser Version.
