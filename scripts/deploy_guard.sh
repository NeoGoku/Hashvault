#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

PROJECT_DIR="/storage/emulated/0/Android/media/com.codex.mobile/hashvault_pro"
REMOTE_NAME="${HASHVAULT_DEPLOY_REMOTE:-origin}"
BRANCH_NAME="${HASHVAULT_DEPLOY_BRANCH:-main}"
PAGES_URL="${HASHVAULT_PAGES_URL:-https://hashvault.pages.dev}"
MAX_WAIT_SEC="${HASHVAULT_DEPLOY_MAX_WAIT:-360}"
POLL_SEC="${HASHVAULT_DEPLOY_POLL_SEC:-10}"

AUTH_DIR="$HOME/.config/hashvault"
AUTH_USER_FILE="$AUTH_DIR/github_user"
AUTH_TOKEN_FILE="$AUTH_DIR/github_token"

if ! command -v git >/dev/null 2>&1; then
  echo "[FEHLER] git fehlt. Installiere zuerst: pkg install -y git"
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "[FEHLER] curl fehlt. Installiere zuerst: pkg install -y curl"
  exit 1
fi

cd "$PROJECT_DIR"

git config --global --add safe.directory "$PROJECT_DIR" >/dev/null 2>&1 || true

if [ ! -f "version.json" ]; then
  echo "[FEHLER] version.json nicht gefunden in $PROJECT_DIR"
  exit 1
fi

LOCAL_BUILD_ID="$(sed -n 's/.*"buildId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' version.json | head -n1)"
if [ -z "$LOCAL_BUILD_ID" ]; then
  echo "[FEHLER] buildId konnte aus version.json nicht gelesen werden."
  exit 1
fi

echo "[INFO] Lokale Build-ID: $LOCAL_BUILD_ID"

git add -A
if ! git diff --cached --quiet; then
  TS="$(date '+%Y-%m-%d %H:%M:%S')"
  git commit -m "auto deploy $TS"
  echo "[OK] Commit erstellt."
else
  echo "[INFO] Keine lokalen Aenderungen zu committen."
fi

if [ -f "$AUTH_USER_FILE" ] && [ -f "$AUTH_TOKEN_FILE" ]; then
  GH_USER="$(cat "$AUTH_USER_FILE")"
  GH_TOKEN="$(cat "$AUTH_TOKEN_FILE")"
  ASKPASS_SCRIPT="$(mktemp)"
  cat > "$ASKPASS_SCRIPT" <<'APEOF'
#!/data/data/com.termux/files/usr/bin/bash
case "$1" in
  *Username*) cat "$AUTH_USER_FILE" ;;
  *Password*) cat "$AUTH_TOKEN_FILE" ;;
  *) echo "" ;;
esac
APEOF
  chmod 700 "$ASKPASS_SCRIPT"
  export AUTH_USER_FILE AUTH_TOKEN_FILE
  export GIT_TERMINAL_PROMPT=0
  export GIT_ASKPASS="$ASKPASS_SCRIPT"
  echo "[INFO] Push mit gespeichertem Token..."
  if ! git push -u "$REMOTE_NAME" "$BRANCH_NAME"; then
    rm -f "$ASKPASS_SCRIPT"
    echo "[FEHLER] Push fehlgeschlagen (Token/Remote pruefen)."
    exit 1
  fi
  rm -f "$ASKPASS_SCRIPT"
else
  echo "[WARN] Kein gespeicherter Token. Push kann nach Username/Passwort fragen."
  git push -u "$REMOTE_NAME" "$BRANCH_NAME"
fi

echo "[OK] Push erfolgreich. Warte auf Cloudflare Deploy..."

ONLINE_BUILD_ID=""
ELAPSED=0
while [ "$ELAPSED" -le "$MAX_WAIT_SEC" ]; do
  RESP="$(curl -fsSL -H 'Cache-Control: no-cache' "$PAGES_URL/version.json?__ts=$(date +%s)" 2>/dev/null || true)"
  ONLINE_BUILD_ID="$(printf '%s' "$RESP" | sed -n 's/.*"buildId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"

  if [ "$ONLINE_BUILD_ID" = "$LOCAL_BUILD_ID" ]; then
    echo "[OK] Deploy bestaetigt. Online Build-ID: $ONLINE_BUILD_ID"
    echo "[URL] $PAGES_URL/?__hvb=$LOCAL_BUILD_ID"
    exit 0
  fi

  echo "[WAIT] Online Build-ID: ${ONLINE_BUILD_ID:-unbekannt} (erwartet: $LOCAL_BUILD_ID)"
  sleep "$POLL_SEC"
  ELAPSED=$((ELAPSED + POLL_SEC))
done

echo "[FEHLER] Deploy-Guard Timeout (${MAX_WAIT_SEC}s)."
echo "[HINWEIS] Push ist durch, aber Cloudflare zeigt noch nicht die erwartete Build-ID."
echo "[CHECK] $PAGES_URL/version.json"
exit 2
