#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PORT="$(grep -E '^PORT=' "$REPO_ROOT/.env" 2>/dev/null | tail -n1 | cut -d '=' -f2-)"
DASHBOARD_URL="http://localhost:${PORT:-3000}"

for _ in $(seq 1 60); do
  if curl -fs "$DASHBOARD_URL/health" > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Best-effort: prevent the display from blanking/sleeping under X11.
# No-op (and harmless) under Wayland/Wayfire, where these calls just fail.
xset s off > /dev/null 2>&1 || true
xset -dpms > /dev/null 2>&1 || true
xset s noblank > /dev/null 2>&1 || true

CHROMIUM_BIN="$(command -v chromium-browser || command -v chromium)"

exec "$CHROMIUM_BIN" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 \
  --incognito \
  "$DASHBOARD_URL"
