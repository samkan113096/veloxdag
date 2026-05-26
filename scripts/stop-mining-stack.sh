#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGS="$ROOT/logs"
for f in node miner monitor; do
  if [[ -f "$LOGS/$f.pid" ]]; then
    kill "$(cat "$LOGS/$f.pid")" 2>/dev/null || true
    rm -f "$LOGS/$f.pid"
  fi
done
pkill -f velox-miner 2>/dev/null || true
pkill -f "veloxd -datadir" 2>/dev/null || true
echo "Mining stack stopped."
