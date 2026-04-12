# Handover Prompt fuer neue Codex-Instanz

Arbeite ab jetzt ausschliesslich in diesem Projektpfad:

`/storage/emulated/0/Android/media/com.codex.mobile/hashvault_pro`

Ignoriere alle anderen alten HashVault-Ordner oder Projektkopien. Es gab frueher Verwechslungen mit einem anderen HashVault-Projekt. Das darf nicht noch einmal passieren.

## Kommunikationsstil

- Antworte kurz, sachlich und komprimiert
- Keine langen Erklaerungen
- Praktisch arbeiten
- Nach Aenderungen immer sauber pruefen
- Wenn etwas unklar ist, konkret nachfragen statt raten

## Projekt

`HashVault Pro` ist ein mobiles Browser-Spiel / Idle-Management-Game mit Mining-, Markt-, Power-, Standort-, Crew-, Research-, Upgrade- und Prestige-Systemen.

## Relevante Dateien zum Einstieg

- `project_context.md`
- `progress.md`
- `version.json`
- `index.html`
- `js/main.js`
- `js/core/gameLoop.js`
- `js/core/state.js`
- `js/core/save.js`
- `js/ui/render.js`
- `scripts/deploy_guard.sh`

## Aktueller Stand

Das Spiel hat bereits:

- Startscreen
- Ladebildschirm
- Save-Slots
- Mining
- mehrere Coins
- Markt
- Rigs
- Upgrades
- Research
- Staff
- Rig Crew
- Haltbarkeit / Explosion / Reparatur
- Stromsystem
- Standorte
- Standort-Shop
- Finanzen / Tageskosten
- Contracts / Dailies / Story Missions
- Prestige / Chips
- Debug
- Tutorial

## Wichtiger aktueller Problemstand

Lokal sind neuere Aenderungen vorhanden, aber Cloudflare Pages zeigt offenbar noch einen alten Build.

Letzter bekannter Widerspruch:

- lokal: Build `20260412v9`
- online: Build `20260412v7`

Im Power-Reiter sollten lokal neue Bereiche existieren:

- `Rig-Layouts pro Standort`
- `Thermik & Cooling`
- `Stromausfall-Entscheidung`

Wenn diese online fehlen, laeuft ein alter Deploy.

## Deployment

Es gibt bereits:

- `scripts/setup_deploy_auth.sh`
- `scripts/deploy_guard.sh`

`deploy_guard.sh` pusht und prueft danach online `version.json` gegen lokal.

## Was du zuerst tun sollst

1. Lies `project_context.md`
2. Lies `progress.md`
3. Pruefe den echten lokalen Stand im Projektordner
4. Pruefe GitHub- und Cloudflare-Deploy-Stand
5. Arbeite erst dann an neuen Features weiter

## Wichtige Anweisung

Nutze niemals einen anderen Projektpfad fuer HashVault. Nur:

`/storage/emulated/0/Android/media/com.codex.mobile/hashvault_pro`
