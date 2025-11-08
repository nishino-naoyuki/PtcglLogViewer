#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT/server"
WEB_DIR="$ROOT/web"
LOG_DIR="$ROOT/.cache/logs"
mkdir -p "$LOG_DIR"

# インストール（未インストール時のみ）
if [ ! -d "$SERVER_DIR/node_modules" ]; then
  echo "[install] server dependencies..."
  (cd "$SERVER_DIR" && npm install)
fi

if [ ! -d "$WEB_DIR/node_modules" ]; then
  echo "[install] web dependencies..."
  (cd "$WEB_DIR" && npm install)
fi

CARD_PROXY_PORT="${CARD_PROXY_PORT:-3001}"
export CARD_PROXY_PORT

# サーバ起動
echo "[start] starting server (proxy) on port ${CARD_PROXY_PORT} ..."
(
  cd "$SERVER_DIR"
  CARD_PROXY_PORT=$CARD_PROXY_PORT npm run dev > "$LOG_DIR/server.log" 2>&1 &
  echo $! > "$LOG_DIR/server.pid"
)

# サーバの起動確認（/health）
echo "[wait] waiting for proxy /health ..."
for i in $(seq 1 15); do
  if curl -s "http://localhost:${CARD_PROXY_PORT}/health" >/dev/null 2>&1; then
    echo "[ok] proxy ready"
    break
  fi
  sleep 1
done

# web 起動
echo "[start] starting web (vite) on port 5173 ..."
(
  cd "$WEB_DIR"
  npm run dev -- --host 0.0.0.0 --port 5173 > "$LOG_DIR/web.log" 2>&1 &
  echo $! > "$LOG_DIR/web.pid"
)

# web の起動確認
echo "[wait] waiting for web server ..."
for i in $(seq 1 20); do
  if curl -sS --head "http://localhost:5173/" >/dev/null 2>&1; then
    echo "[ok] web ready"
    break
  fi
  sleep 1
done

echo
echo "開発サーバ 起動済:"
echo "  Web UI : http://localhost:5173"
echo "  Proxy  : http://localhost:${CARD_PROXY_PORT}/card-image?name=Drakloak"
echo "ログ: $LOG_DIR (server.log, web.log)"
echo

# ブラウザを開く（devcontainer のルールに従い "$BROWSER" を使う）
"$BROWSER" "http://localhost:5173" || true

# 終了時に子プロセスを停止するハンドラ
cleanup() {
  echo
  echo "停止処理: サーバを終了します..."
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

# フォアグラウンドで web プロセスを待つ（スクリプトが生きている間はブラウザを開いたままにする）
if [ -f "$LOG_DIR/web.pid" ]; then
  wait "$(cat "$LOG_DIR/web.pid")" 2>/dev/null || true
else
  # PID ファイルが無ければ単に待機
  sleep infinity
fi