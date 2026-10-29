# Betoot

**Wissen trifft Bauchkribbeln.** Eine Live-Quiz-App für Gruppen: Spiel erstellen, Fragen vorbereiten und alle mit einem Code einladen. Ohne Konto oder Passwort.

Betoot läuft mit Next.js, React und PostgreSQL. Es gibt eine Host-Ansicht für Spielleitung und Präsentation sowie eine Teilnehmer-Ansicht für Handy oder Browser.

## Funktionen

- Landingpage mit **Spiel beitreten** und **Spiel erstellen**.
- Jede Person kann ein eigenes Spiel erstellen; nur der erstellende Browser erhält dessen Spielleitung.
- Eigene Fragen mit zwei bis vier Antworten, Quoten, Zeitfenster und Auflösung. Drei allgemeine Beispielfragen sind optional verfügbar.
- Zwölf Avatare, animierte Lobby, virtuelle Coins, Einsätze, All-in und einmaliges Comeback bei 0 Coins.
- Live-Bühne mit Countdown, QR-Code, Rundenübergängen, Reveal, Rangliste und Top-3-Podium.
- Eigene Soundeffekte und Hintergrundmusik mit getrennten Schaltern.
- Lokale Markenschriften Fredoka und DM Sans, eigenes SVG-Logo und App-Icon. Das Konzept ist in [BRAND.md](BRAND.md) dokumentiert.
- Keine Echtgeldzahlungen oder auszahlbaren Gewinne.

## Lokal starten

Voraussetzungen: Node.js 22.13+ und Docker Compose oder ein bestehender PostgreSQL-Server.

```bash
npm ci
cp .env.example .env.local
docker compose up -d
npm run db:migrate
npm run dev
```

Die lokale Konfiguration in `.env.local`:

```dotenv
DATABASE_URL=postgresql://betoot:betoot@localhost:5432/betoot
```

Öffne `http://localhost:3000`. Du brauchst kein Host-Passwort und keinen zusätzlichen Auth-Dienst. Erstelle ein Spiel, passe die Fragen an und teile den Spielcode.

## Vercel + PostgreSQL

1. Repository als Next.js-Projekt in Vercel importieren.
2. PostgreSQL bereitstellen und den **gepoolten** Connection-String als `DATABASE_URL` setzen. SSL-Parameter des Anbieters beibehalten.
3. Migrationen bewusst gegen die Ziel-Datenbank ausführen: deren direkten Connection-String lokal als `MIGRATION_DATABASE_URL` in `.env.local` setzen und `npm run db:migrate` ausführen.
4. Mit `npm run build` deployen. Der Build verändert kein Datenbank-Schema und braucht keine Datenbank-Verbindung.

Die App braucht nur `DATABASE_URL`; für lokale Migrationen kann `MIGRATION_DATABASE_URL` abweichen. Preview-Deployments sollten eine eigene Datenbank verwenden. Es wird kein WebSocket-Server benötigt.

## Vorhandene Installation aktualisieren

`npm run db:migrate` führt `001-init` und anschliessend `002-open-hosting` versionsgesichert aus. Die zweite Migration ergänzt die Besitzerzuordnung für anonyme Spielleitungen und das Limit für neue Spiele.

Spiele ohne Besitzerzuordnung werden nicht automatisch einem beliebigen Browser zugewiesen. Damit lassen sie sich nicht über einen öffentlichen Spielcode übernehmen. Für einen Probelauf mit dem neuen Modell ein neues Spiel erstellen.

## Spielen

| Rolle         | Adresse        | Ablauf                                                        |
| ------------- | -------------- | ------------------------------------------------------------- |
| Start         | `/`            | Code eingeben oder Spiel erstellen                            |
| Eigene Spiele | `/host`        | Neues Spiel anlegen und Spiele dieses Browsers wieder öffnen  |
| Spielleitung  | `/host/ABC234` | Fragen privat vorbereiten, dann Live-Spiel zeigen und steuern |
| Mitspielen    | `/play/ABC234` | Avatar und Namen wählen, Antworten und Einsätze setzen        |

`ABC234` steht für den generierten Spielcode. Alte Projektions-Bookmarks unter `/screen/ABC234` leiten auf die Host-Seite weiter; sie geben keine Host-Rechte.

1. Spiel erstellen und Fragen im Vorbereitungsmodus anpassen.
2. Auf **Live-Spiel** wechseln und diese Ansicht auf Beamer oder im Videocall teilen.
3. Alle scannen den QR-Code oder geben den Spielcode ein.
4. Wette öffnen, Einsätze schliessen oder den Countdown abwarten.
5. Bei Bedarf zu Slides oder einer Demo wechseln. Einsätze bleiben gespeichert.
6. Auf derselben Host-Seite auflösen, die nächste Frage öffnen und am Ende das Finale starten.

Der Vorbereitungsmodus zeigt Lösungen und kommende Fragen. Er gehört nicht ins Screensharing. Der Live-Modus zeigt sie erst beim Reveal.

## Ohne Konto, mit eigener Spielleitung

Beim Erstellen bekommt der Browser einen zufälligen 256-Bit-Token in einem HttpOnly-Cookie. In der Datenbank liegt nur dessen SHA-256-Hash als Besitzer des Spiels.

- Die Spielübersicht lädt ausschliesslich Spiele dieses Besitzers.
- Jede Host-Mutation prüft die Besitzerzuordnung innerhalb der Spiel-Transaktion.
- Ein falscher oder fehlender Token erhält keine Lösungen und kann weder Fragen ändern noch Runden steuern.
- Der öffentliche Spielcode reicht nur zum Mitspielen.
- Das Cookie ist SameSite=Lax, unter HTTPS Secure und bis zu 180 Tage gültig. Löscht man die Browserdaten oder wechselt den Browser, geht die Spielleitung verloren. Es gibt noch keinen Wiederherstellungs- oder Übertragungsprozess.
- Pro IP sind maximal zehn neue Spiele in einem 15-Minuten-Fenster möglich. Die Rate-Limit-Tabelle speichert einen Hash des Schlüssels.

Erstelle dein Spiel auf dem Gerät, mit dem du präsentieren möchtest. Für mehrere Testspieler auf einem Rechner getrennte Browserprofile verwenden.

## Coins und Fristen

Alle starten mit 1’000 virtuellen Coins. Pro Person und Runde ist ein verbindlicher Einsatz möglich. Eine Quote enthält den Einsatz: 100 × 3.0 ergibt 300 Coins Auszahlung und 200 Coins Nettogewinn. Quoten liegen zwischen × 1.1 und × 20.0 in 0.1-Schritten.

Die Datenbank prüft die Frist. Nach Ablauf sind Einsätze geschlossen, auch wenn die Spielleitung gerade etwas anderes präsentiert. Ein wiederholtes Reveal zahlt nicht mehrfach aus. Wer bei 0 Coins steht und keine offene eigene Wette mehr hat, erhält einmalig 300 Comeback-Coins.

Auszahlungen werden auf ganze Coins abgerundet. Der Kontostand ist auf eine Milliarde Coins begrenzt. Die Rangliste zeigt verfügbares Guthaben nach Abzug offener Einsätze; Gleichstände werden alphabetisch sortiert.

## Musik & Effekte

**Sound** einmal per Klick aktivieren. Ein weiterer Button schaltet nur die Hintergrundmusik aus. Nach dem Schliessen einer Wette stoppt die Melodie. Versteckte Tabs verstummen. Teilnehmer können ihre Einsatz- und Ergebnis-Sounds aktivieren; ihre Geräte spielen keine Hintergrundmusik.

Die Töne werden lokal mit Web Audio synthetisiert. Reduzierte Bewegung wird bei Animationen und Konfetti respektiert.

## Technik & Tests

```bash
npm test
npm run build
npm run typecheck
```

- PostgreSQL-Transaktionen und eine Session-Sperre serialisieren Einsätze und Auszahlungen.
- Öffentliche Snapshots enthalten weder zukünftige Fragen noch unrevealte Lösungen oder Token-Hashes.
- Polling: beim Host alle 800 ms, bei Mitspielenden alle 1.8 Sekunden nach Abschluss der letzten Anfrage; in versteckten Tabs 5 Sekunden.
- Tests verwenden PGlite mit echtem SQL. Der einzelne Test-Adapter serialisiert Verbindungen; er ersetzt keinen Mehrverbindungs-Lasttest gegen PostgreSQL.
- CI führt Tests und Production-Build aus.

Eine Session erlaubt maximal 300 Teilnehmer und 50 Fragen. Das ist eine Eingabegrenze, keine verifizierte Kapazitätszusage. Vor grösseren Veranstaltungen mit eurer erwarteten Gruppengrösse auf der Ziel-Infrastruktur testen.

### Shared-screen show

The host polls every 800 ms after the previous request completes (players: 1.8 s; hidden tabs: 5 s). Host-only activity includes total committed Coins, counts and the last five named bets with no answer choices. The shared screen shows the latest three arrivals, animated counters and participation progress. It never shows answer distribution while voting. All-ins have a separate sound cue when sound is enabled.

After reveal, the host chooses **Zwischenstand zeigen** for an animated Top 3 interlude, then opens the next question or the finale. Standings presentation is local to that host browser, with no extra game state or migration. The shared stage has no persistent leaderboard; phones show only their own rank and result. 36 original SVG avatars share the same IDs across joins, lobby and podium; original IDs remain compatible.
