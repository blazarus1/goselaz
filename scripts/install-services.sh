#!/usr/bin/env bash
# One-time setup: run this on the Raspberry Pi (not the Mac) after cloning
# the repo, installing dependencies, and building the client:
#
#   cd goselaz/server && npm install
#   cd ../client && npm install && npm run build
#   cd ../scripts && ./install-services.sh
#
# After this runs once, the dashboard server starts automatically on every
# boot (systemd) and Chromium opens it in kiosk mode at the next desktop
# login. No further SSH access is needed for normal day-to-day power-on.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
CLIENT_DIST="$REPO_ROOT/client/dist"
RUN_USER="$(whoami)"
NODE_BIN="$(command -v node || true)"

if [ -z "$NODE_BIN" ]; then
  echo "Could not find 'node' on PATH for user '$RUN_USER'. Install Node.js first." >&2
  exit 1
fi

if [ ! -f "$CLIENT_DIST/index.html" ]; then
  echo "Client build not found at $CLIENT_DIST." >&2
  echo "Run this first: (cd \"$REPO_ROOT/client\" && npm install && npm run build)" >&2
  exit 1
fi

PORT="$(grep -E '^PORT=' "$REPO_ROOT/.env" 2>/dev/null | tail -n1 | cut -d '=' -f2-)"
DASHBOARD_URL="http://localhost:${PORT:-3000}"

echo "Installing systemd service for the dashboard server (user: $RUN_USER, node: $NODE_BIN)..."
sudo tee /etc/systemd/system/goselaz-dashboard.service > /dev/null <<EOF
[Unit]
Description=Goselaz Household Dashboard server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$SERVER_DIR
ExecStart=$NODE_BIN src/index.js
Restart=on-failure
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable goselaz-dashboard.service
sudo systemctl restart goselaz-dashboard.service

echo "Waiting for the server to come up at $DASHBOARD_URL ..."
up=false
for _ in $(seq 1 30); do
  if curl -fs "$DASHBOARD_URL/health" > /dev/null 2>&1; then
    up=true
    break
  fi
  sleep 1
done

if [ "$up" = true ]; then
  echo "Server is up."
else
  echo "Server did not respond within 30s. Check: sudo systemctl status goselaz-dashboard.service" >&2
fi

echo "Installing kiosk autostart entry for $RUN_USER..."
chmod +x "$REPO_ROOT/scripts/launch-kiosk.sh"
mkdir -p "$HOME/.config/autostart"
cat > "$HOME/.config/autostart/goselaz-dashboard-kiosk.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Goselaz Dashboard Kiosk
Exec=$REPO_ROOT/scripts/launch-kiosk.sh
X-GNOME-Autostart-enabled=true
EOF

cat <<MSG

Done.

- The dashboard server now starts automatically on every boot and restarts
  itself if it crashes (systemd unit: goselaz-dashboard.service).
- Chromium will open the dashboard in kiosk mode automatically the next
  time this user logs into the desktop.

If the Pi doesn't log into the desktop by itself after power-on, enable
auto-login so the kiosk actually launches unattended:
  sudo raspi-config -> System Options -> Boot / Auto Login -> Desktop Autologin

Useful commands:
  sudo systemctl status goselaz-dashboard.service   # check the server
  sudo systemctl restart goselaz-dashboard.service  # restart after a git pull
  journalctl -u goselaz-dashboard.service -f        # tail server logs
MSG
