# Betoot

**Wissen trifft Bauchkribbeln.**

Betoot bringt Menschen über Fragen zusammen. Es geht um Wissen, Bauchgefühl und den Moment, in dem alle gleichzeitig auf die Auflösung warten. Die Marke ist unabhängig von einer Firma, einem Eventformat oder einem bestimmten Ort.

## Persönlichkeit

Neugierig, herzlich, etwas frech. Wir sprechen Menschen mit „du“ an, machen den Einstieg leicht und feiern auch ein mutiges Danebenliegen. Eine falsche Antwort ist der Anfang der nächsten Runde.

## Farben

| Farbe     | Hex       | Aufgabe                                                 |
| --------- | --------- | ------------------------------------------------------- |
| Oat       | `#FFF8ED` | Warmer Hintergrund für Landingpage und Spiel-Erstellung |
| Ink       | `#192650` | Texte, ruhige Flächen und Spielsteuerung                |
| Pop Blue  | `#285BF2` | Primäre Aktionen und die Live-Bühne                     |
| Tangerine | `#FF784F` | Markenfigur, Akzente und emotionale Headlines           |
| Peach     | `#FFB496` | Antwort A und warme Highlights                          |
| Sky       | `#ADDFFA` | Antwort B                                               |
| Butter    | `#FFE18A` | Antwort C und Coins                                     |
| Mint      | `#C0EBCF` | Antwort D und positive Momente                          |
| Lilac     | `#B9A7F3` | Avatar- und Podium-Akzente                              |

Orange wird als Akzent eingesetzt, nicht für lange Texte auf hellem Hintergrund. Dunkle Schrift auf den pastellfarbenen Antwortkacheln hält Antworten lesbar.

## Schrift

- **Fredoka Variable:** Wortmarke, Headlines, grosse Zahlen und Podium. Runde Formen, mittleres Gewicht, keine künstliche Kursivstellung.
- **DM Sans Variable:** Fliesstext, Formulare, Buttons und Spielinformationen.
- Monospace-Fallback für kurze Spielcodes.

Beide Markenschriften werden über die Fontsource-Pakete lokal ausgeliefert. Die Oberfläche benötigt keine Anfrage an einen externen Schriften-Dienst.

## Logo und Figur

Die orange Sprechblasen-Figur hat zwei neugierige Augen und ein kleines Lächeln. Sie steht für Fragen, Begegnung und das gemeinsame Aha-Erlebnis. Die Wortmarke lautet **betoot.** in Kleinbuchstaben; der blaue Punkt setzt den Abschluss.

Die SVG-Figur ist in `components/brand.tsx` definiert. `public/icon.svg` ist das passende App-Icon. Beide bleiben als Vektoren in jeder Grösse scharf.

## Bewegung und Klang

Avatare hüpfen beim Beitritt, Antwortkacheln reagieren auf Auswahl, Coins zählen sichtbar hoch und das Podium erscheint nacheinander. Die Spielleitung steuert den Rhythmus. Reduzierte Bewegung respektiert die Systemeinstellung.

Eigene, synthetisierte Töne begleiten Beitritt, Einsatz, Countdown, Auflösung und Finale. Hintergrundmusik ist separat abschaltbar; beim Wechsel in einen anderen Tab verstummt die Ausgabe.

## Zwei Rollen

- **Spielleitung:** Spiel ohne Konto erstellen, Fragen vorbereiten, Live-Spiel moderieren.
- **Mitspieler:innen:** Spielcode eingeben, Avatar wählen, Antworten und Einsätze festlegen.

Ein Button hat eine klare Aufgabe. Der Spielcode lädt zum Mitspielen ein; er gibt keine Rechte zur Spielleitung.
