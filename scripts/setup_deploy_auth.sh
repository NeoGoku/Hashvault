#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

AUTH_DIR="$HOME/.config/hashvault"
AUTH_USER_FILE="$AUTH_DIR/github_user"
AUTH_TOKEN_FILE="$AUTH_DIR/github_token"

mkdir -p "$AUTH_DIR"
chmod 700 "$AUTH_DIR"

printf "GitHub Username: "
read -r GH_USER
printf "GitHub Token (PAT): "
read -r -s GH_TOKEN
echo

if [ -z "${GH_USER}" ] || [ -z "${GH_TOKEN}" ]; then
  echo "[FEHLER] Username oder Token leer."
  exit 1
fi

printf "%s" "$GH_USER" > "$AUTH_USER_FILE"
printf "%s" "$GH_TOKEN" > "$AUTH_TOKEN_FILE"
chmod 600 "$AUTH_USER_FILE" "$AUTH_TOKEN_FILE"

echo "[OK] Zugangsdaten gespeichert unter $AUTH_DIR"
echo "[INFO] Jetzt kannst du scripts/deploy_guard.sh ohne Passwort-Prompt nutzen."
