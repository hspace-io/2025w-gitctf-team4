#!/usr/bin/env sh
set -e

echo "[Entrypoint] Starting Node server..."
node server.js &
NODE_PID=$!

sleep 1

if command -v nc >/dev/null 2>&1; then
  echo "[Entrypoint] Waiting for Node server on port 5000..."
  for i in $(seq 1 30); do
    if nc -z 127.0.0.1 5000 2>/dev/null; then
      echo "[Entrypoint] Node server is up."
      break
    fi
    echo "[Entrypoint] Still waiting for server... ($i)"
    sleep 1
  done
else
  echo "[Entrypoint] 'nc' not found, skipping port wait."
fi

echo "[Entrypoint] Starting admin bot in background (logging to /var/log/admin_bot.log)..."
mkdir -p /var/log

python3 /app/admin_bot.py >> /var/log/admin_bot.log 2>&1 &

echo "[Entrypoint] Handing over control to Node server (PID=$NODE_PID)"
# Node 프로세스가 죽을 때까지 컨테이너 유지
wait "$NODE_PID"
echo "[Entrypoint] Node server exited, shutting down container."
