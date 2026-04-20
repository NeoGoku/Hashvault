#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

PROJECT_DIR="/sdcard/Download/codex/hashvault"
GIT_DIR_PATH="${HASHVAULT_GIT_DIR:-$HOME/hashvault_git/.git}"
BRANCH="${HASHVAULT_DEPLOY_BRANCH:-main}"
REMOTE="${HASHVAULT_DEPLOY_REMOTE:-origin}"

AUTH_DIR="$HOME/.config/hashvault"
AUTH_USER_FILE="$AUTH_DIR/github_user"
AUTH_TOKEN_FILE="$AUTH_DIR/github_token"

gitw() { git --git-dir="$GIT_DIR_PATH" --work-tree="$PROJECT_DIR" "$@"; }

if ! command -v git >/dev/null 2>&1; then
  echo "[ERR] git fehlt. Installiere in Termux: pkg install git"
  exit 1
fi
if [ ! -d "$PROJECT_DIR" ]; then
  echo "[ERR] Projektordner fehlt: $PROJECT_DIR"
  exit 1
fi
if [ ! -f "$GIT_DIR_PATH/config" ]; then
  echo "[ERR] Git-Repo fehlt: $GIT_DIR_PATH"
  echo "      Bitte einmal ausfuehren: git clone https://github.com/NeoGoku/Hashvault.git \"$HOME/hashvault_git\""
  exit 1
fi

# Sicherstellen, dass origin korrekt gesetzt ist.
if ! gitw remote get-url "$REMOTE" >/dev/null 2>&1; then
  gitw remote add "$REMOTE" https://github.com/NeoGoku/Hashvault.git
fi

# Lokale Git-Identity falls nicht gesetzt.
if [ -z "$(gitw config --get user.name || true)" ]; then
  gitw config user.name "${HASHVAULT_GIT_NAME:-HashVault Deploy}"
fi
if [ -z "$(gitw config --get user.email || true)" ]; then
  gitw config user.email "${HASHVAULT_GIT_EMAIL:-hashvault-deploy@local.invalid}"
fi

# Immer neue vorlaufende Build-ID erzeugen (Cache-Busting).
BUILD_ID="$(date -u +%Y%m%d%H%M%S)"
BUILD_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

sed -i "s/const BUILD_ID = '[^']*';/const BUILD_ID = '${BUILD_ID}';/" "$PROJECT_DIR/index.html"
sed -i "s/\"buildId\": \"[^\"]*\"/\"buildId\": \"${BUILD_ID}\"/" "$PROJECT_DIR/version.json"
sed -i "s/\"generatedAt\": \"[^\"]*\"/\"generatedAt\": \"${BUILD_ISO}\"/" "$PROJECT_DIR/version.json"

MSG="${1:-deploy: build ${BUILD_ID}}"

gitw add -A
if gitw diff --cached --quiet; then
  echo "[INFO] Keine Aenderungen zum Deployen."
  exit 0
fi

gitw commit -m "$MSG"
echo "[INFO] Push -> $REMOTE/$BRANCH"

if [ -f "$AUTH_USER_FILE" ] && [ -f "$AUTH_TOKEN_FILE" ]; then
  ASKPASS_SCRIPT="$(mktemp)"
  cat > "$ASKPASS_SCRIPT" <<'EOF'
#!/data/data/com.termux/files/usr/bin/bash
case "$1" in
  *Username*) cat "$AUTH_USER_FILE" ;;
  *Password*) cat "$AUTH_TOKEN_FILE" ;;
  *) echo "" ;;
esac
EOF
  chmod 700 "$ASKPASS_SCRIPT"
  export AUTH_USER_FILE AUTH_TOKEN_FILE
  export GIT_TERMINAL_PROMPT=0
  export GIT_ASKPASS="$ASKPASS_SCRIPT"
  if ! gitw push "$REMOTE" "$BRANCH"; then
    rm -f "$ASKPASS_SCRIPT"
    echo "[ERR] Push fehlgeschlagen. Token/Remote pruefen."
    exit 1
  fi
  rm -f "$ASKPASS_SCRIPT"
else
  if ! gitw push "$REMOTE" "$BRANCH"; then
    echo "[ERR] Push fehlgeschlagen (keine Credentials)."
    echo "      Einmalig: bash /sdcard/Download/codex/hashvault/scripts/setup_deploy_auth.sh"
    exit 1
  fi
fi

echo "[OK] Deploy abgeschlossen. Build-ID: $BUILD_ID"
