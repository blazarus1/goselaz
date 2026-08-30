#!/usr/bin/env bash
# Run on the Pi to pick up new commits: pulls, reinstalls/rebuilds if
# needed, and restarts the dashboard service.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Pulling latest changes..."
git -C "$REPO_ROOT" pull

echo "Installing server dependencies..."
(cd "$REPO_ROOT/server" && npm install)

echo "Installing client dependencies and rebuilding..."
(cd "$REPO_ROOT/client" && npm install && npm run build)

echo "Restarting dashboard service..."
sudo systemctl restart goselaz-dashboard.service

if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

DASHBOARD_URL="http://localhost:${PORT:-3000}"

echo "Waiting for the server to come back up..."
for _ in $(seq 1 30); do
  if curl -fs "$DASHBOARD_URL/health" > /dev/null 2>&1; then
    echo "Server is up."
    exit 0
  fi
  sleep 1
done

echo "Server did not respond within 30s. Check: sudo systemctl status goselaz-dashboard.service" >&2
exit 1
