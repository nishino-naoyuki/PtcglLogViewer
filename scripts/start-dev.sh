#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT/server"
WEB_DIR="$ROOT/web"
LOG_DIR="$ROOT/.cache/logs"
mkdir -p "$LOG_DIR"

# install if needed
if [ ! -d "$SERVER_DIR/node_modules" ]; then
  echo "[install] server deps..."
  (cd "$SERVER_DIR" && npm install)
fi

if [ ! -d "$WEB_DIR/node_modules" ]; then
  echo "[install] web deps..."
  (cd "$WEB_DIR" && npm install)
fi

CARD_PROXY_PORT="${CARD_PROXY_PORT:-3001}"
export CARD_PROXY_PORT

# start server
echo "[start] server (proxy) on port ${CARD_PROXY_PORT} ..."
(
  cd "$SERVER_DIR"
  CARD_PROXY_PORT=$CARD_PROXY_PORT npm run dev > "$LOG_DIR/server.log" 2>&1 &
  echo $! > "$LOG_DIR/server.pid"
)

# wait for server health
echo "[wait] waiting for proxy /health ..."
for i in $(seq 1 15); do
  if curl -s "http://localhost:${CARD_PROXY_PORT}/health" >/dev/null 2>&1; then
    echo "[ok] proxy ready"
    break
  fi
  sleep 1
done

# start web
echo "[start] web (vite) on port 5173 ..."
(
  cd "$WEB_DIR"
  npm run dev -- --host 0.0.0.0 --port 5173 > "$LOG_DIR/web.log" 2>&1 &
  echo $! > "$LOG_DIR/web.pid"
)

# wait for web
echo "[wait] waiting for web server ..."
for i in $(seq 1 20); do
  if curl -sS --head "http://localhost:5173/" >/dev/null 2>&1; then
    echo "[ok] web ready"
    break
  fi
  sleep 1
done

echo
echo "Servers started:"
echo "  Web : http://localhost:5173"
echo "  Proxy: http://localhost:${CARD_PROXY_PORT}/card-image?name=Drakloak"
echo "Logs: $LOG_DIR (server.log, web.log)"
echo

# open browser (devcontainer host)
"$BROWSER" "http://localhost:5173" || true

cleanup() {
  echo
  echo "Stopping processes..."
  if [ -f "$LOG_DIR/web.pid" ]; then
    kill "$(cat "$LOG_DIR/web.pid")" 2>/dev/null || true
    rm -f "$LOG_DIR/web.pid"
  fi
  if [ -f "$LOG_DIR/server.pid" ]; then
    kill "$(cat "$LOG_DIR/server.pid")" 2>/dev/null || true
    rm -f "$LOG_DIR/server.pid"
  fi
}
trap cleanup EXIT

# wait on web process
if [ -f "$LOG_DIR/web.pid" ]; then
  wait "$(cat "$LOG_DIR/web.pid")" 2>/dev/null || true
else
  sleep infinity
fi