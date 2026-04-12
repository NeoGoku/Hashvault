# HashVault Pro - Projektkontext

Hinweis: Das ist kein garantierter 1:1-Rohmitschnitt der gesamten Unterhaltung. Ein exakter Vollmitschnitt ist aus der aktuellen Sitzung nicht mehr vollstaendig rekonstruierbar, weil nicht alle alten Assistant-Antworten wortgetreu im Kontext vorliegen. Diese Datei ist deshalb als belastbarer Arbeitsstand fuer andere Codex-Instanzen gedacht.

## Kanonischer Projektpfad

Nur dieser Pfad ist gueltig:

`/storage/emulated/0/Android/media/com.codex.mobile/hashvault_pro`

Andere alte HashVault-Ordner oder Projektkopien sollen ignoriert werden.

## Kommunikationsvorgaben des Users

- Antworten kurz und inhaltlich komprimiert
- Kein unnoetiges Drumherum
- Keine langen theoretischen Ausfuehrungen
- Praktisch arbeiten, sauber patchen, danach verifizieren
- Wenn moeglich keine neue Termux-Handarbeit fuer den User

## Projektart

Browserbasiertes Idle-/Clicker-/Management-Spiel namens `HashVault Pro`.

Tech-Stand:

- HTML
- CSS
- Vanilla JavaScript
- Modulstruktur unter `js/core`, `js/data`, `js/systems`, `js/ui`

## Wichtige Hauptsysteme im Spiel

Bereits vorhanden oder im Verlauf aufgebaut:

- Ladebildschirm / Startbildschirm
- Neues Spiel mit Nickname
- Save-Slots mit vollstaendigen Slot-Spielstaenden
- Save-Slot-UI mit Metadaten
- Mining-Loop
- Mehrere Coins
- Markt / Preisentwicklung
- Rig-Kauf
- Rig-Verkauf
- Upgrades
- Research
- Staff
- Separater Rig-Crew-Reiter
- Haltbarkeit / Explosionslogik / Reparaturlogik
- Auto-Repair
- Stromverbrauch
- Stromanbieter / Tarife / Kapazitaet
- Tagesabrechnung / Fixkosten / Finanzen
- Standorte / Umzug / Standortboni
- Standort-Shop
- Missionen / Contracts / Goals / Daily Challenges / Story Missions
- Prestige / Quantum Chips
- NPC Trader
- Debug-Overlay / Debug-Funktionen
- Tutorial-System
- Cloudflare/GitHub-Deployment-Versuch

## Balancing- und Designentscheidungen aus dem Verlauf

- Das Spiel soll grindig und laenger motivierend sein
- Fortschritt darf nicht zu schnell eskalieren
- Strom und Fixkosten muessen realen Druck erzeugen
- Nicht nur Bitcoin soll sinnvoll sein
- Coins sollen unterschiedliche Utilities / Rollen bekommen
- Reale Preise 1:1 ins ganze Spiel zu uebernehmen wurde als schlechte Idee bewertet
- Besser: hybrider Marktansatz statt starre Realweltkopie

## Coin-Rollen

Im Verlauf wurde in diese Richtung gearbeitet:

- BTC: Power-Upgrades / Premium-Wert
- ETH: Research-Fuel
- LTC: Reparaturen
- BNB: Betriebs-/Kostenvorteile

Ziel war, dass nicht immer nur BTC optimal ist.

## Wichtige bereits gefixte Themen aus dem Verlauf

- Save-Slots nur im passenden Reiter, nicht auf der Startseite
- Ruecktaste im Save-Slot-Reiter
- Mobile Zentrierung / Handy-Anpassung
- Echte Modulverdrahtung statt Fake-Loader
- No-cache / Host-Thema mehrfach bearbeitet
- Haltbarkeit nach Explosion musste wieder korrekt bei 100 starten
- Haltbarkeitsanzeige hatte mal bei 0 festgehangen und wurde gefixt
- Auto-Repair durfte nicht explodierende Rigs durchlassen
- Power-Fenster / Standort-Fenster / Crew-Auswahl hatten mehrfach UI-Probleme
- Marktbewegung war mehrfach zu hektisch oder zu statisch und wurde ueberarbeitet
- Manual Click + Hold-to-Mine wurden kombiniert
- Combo/Hash-Multiplikator musste wieder sauber resetten
- iOS-Zoomproblem beim Mining-Button wurde adressiert

## Letzter groesserer Roadmap-Stand

Es wurde eine Roadmap mit Phasen aufgebaut.

### Phase 1

War laut Verlauf bereits fertig bzw. vom User visuell akzeptiert.

### Phase 2

Wurde von mir lokal umgesetzt, aber der Online-Stand hing hinterher. Inhalt von Phase 2:

- Cooling-Auto-Profile
- Stromausfall-Autoplan
- Neue Tracking-Counter:
  - `layoutSwitchCount`
  - `coolingModeChanges`
  - `outageDecisions`
- Neue Controls im Power-Reiter
- Neue Contract-Typen zu Power/Cooling/Outage
- Save-/State-Unterstuetzung fuer diese Daten

### Betroffene Dateien von Phase 2

- `js/core/state.js`
- `js/core/save.js`
- `js/core/gameLoop.js`
- `js/main.js`
- `js/ui/render.js`
- `js/systems/contracts.js`
- `js/data/contracts.js`
- `index.html`
- `version.json`
- `progress.md`

### Phase-2-UI, die sichtbar sein sollte

Im Reiter `Power` sollten zusaetzlich sichtbar sein:

- `Rig-Layouts pro Standort`
- `Thermik & Cooling`
- `Stromausfall-Entscheidung`

Wenn diese drei Karten fehlen, laeuft nicht der aktuelle Build.

## Build-/Deploy-Stand

Lokaler Build-Stand zum Zeitpunkt der letzten Diskussion:

- `20260412v9`

Online lief aber laut Script noch:

- `20260412v7`

Das war der zentrale Widerspruch:

- Lokal neue Features vorhanden
- Git-Push erfolgreich
- Cloudflare Pages zeigte weiterhin alten Build

## Deployment-Setup

Im Projekt liegen diese Scripts:

- `scripts/setup_deploy_auth.sh`
- `scripts/deploy_guard.sh`

Zweck:

- GitHub-Auth einmal speichern
- One-click Deploy mit Build-Guard
- Danach online `version.json` gegen lokal pruefen

Zusatz:

- Termux-Widget-Shortcut fuer Deploy wurde angelegt
- Fruehere Tunnel-Widget-Skripte sollten entfernt werden

## Aktuelles Problem vor dieser Datei

Der User hat `deploy_guard.sh` gestartet.

Ergebnis laut Screenshot:

- lokale Build-ID: `20260412v9`
- keine lokalen Aenderungen zu committen
- Push erfolgreich
- online Build-ID blieb mehrfach auf `20260412v7`

Das bedeutet:

- Nicht das lokale Patching ist das Hauptproblem
- Das Deployment auf Cloudflare Pages zieht den aktuellen Stand nicht nach

## Wichtige Aussage zum Chat-Speicher

Diese Unterhaltung liegt nicht als normale Projektdatei unter dem Projektpfad. Deshalb wurde diese Kontextdatei angelegt, damit eine andere App oder eine weitere Codex-Instanz denselben Stand einlesen kann.

## Dateien, die als Einstieg fuer eine neue Instanz wichtig sind

- `progress.md`
- `project_context.md`
- `version.json`
- `index.html`
- `js/main.js`
- `js/core/gameLoop.js`
- `js/core/state.js`
- `js/core/save.js`
- `js/ui/render.js`
- `scripts/deploy_guard.sh`

## Nächste sinnvolle Schritte

1. GitHub-Remote und letzten Commit gegen lokalen Stand pruefen
2. Cloudflare Pages Build-Quelle und Deploy-Logs pruefen
3. Sicherstellen, dass `main` wirklich auf das richtige Repo und den aktuellen Commit zeigt
4. Erst danach weitere Feature-Arbeit fortsetzen

## Kurzfassung fuer eine andere Codex-Instanz

Arbeite ausschliesslich in:

`/storage/emulated/0/Android/media/com.codex.mobile/hashvault_pro`

Nutze keine anderen HashVault-Projektordner.

Der User will kurze Antworten.

Lokale Phase-2-Aenderungen sind drin, aber Cloudflare zeigt noch einen alten Build (`v7` statt `v9`). Das aktuelle Problem ist deshalb primaer Deployment/Pages und nicht die eigentliche Spiellogik.
