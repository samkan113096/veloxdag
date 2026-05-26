#!/usr/bin/env bash
# VeloxDAG integration smoke test — run from repo root
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHAIN="$ROOT/chain"
DATADIR=$(mktemp -d)
PORT=$((18000 + RANDOM % 1000))
MINER="velx1audittest00000000000000000000000"

cleanup() {
  pkill -f "veloxd -datadir $DATADIR" 2>/dev/null || true
  rm -rf "$DATADIR"
}
trap cleanup EXIT

cd "$CHAIN"
go build -o bin/veloxd ./cmd/veloxd
go build -o bin/velox-miner ./cmd/velox-miner

echo "==> Starting node on port $PORT"
./bin/veloxd -datadir "$DATADIR" -port "$PORT" &
sleep 2

echo "==> Health check"
curl -sf "http://127.0.0.1:$PORT/health" | grep -q VeloxDAG

echo "==> Chain info (fair launch)"
INFO=$(curl -sf "http://127.0.0.1:$PORT" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getchaininfo","params":{},"id":1}')
echo "$INFO" | grep -q '"fairLaunch":true'
echo "$INFO" | grep -q '"blocks":1'

echo "==> Get block template"
TEMPLATE=$(curl -sf "http://127.0.0.1:$PORT" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"getblocktemplate\",\"params\":{\"miner\":\"$MINER\"},\"id\":2}")
echo "$TEMPLATE" | grep -q headerPrefix

echo "==> Mine one block (up to 60s)"
./bin/velox-miner -rpc "http://127.0.0.1:$PORT" -miner "$MINER" -threads 4 &
MINER_PID=$!
for i in $(seq 1 60); do
  BAL_RAW=$(curl -sf "http://127.0.0.1:$PORT" -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"getbalance\",\"params\":{\"address\":\"$MINER\"},\"id\":3}" 2>/dev/null || echo "")
  if echo "$BAL_RAW" | grep -q '"balance":[1-9]'; then
    echo "Block mined after ${i}s"
    break
  fi
  sleep 1
done
kill $MINER_PID 2>/dev/null || true
wait $MINER_PID 2>/dev/null || true

BAL=$(curl -sf "http://127.0.0.1:$PORT" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"getbalance\",\"params\":{\"address\":\"$MINER\"},\"id\":3}")
echo "$BAL"

BLOCKS=$(curl -sf "http://127.0.0.1:$PORT" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getchaininfo","params":{},"id":4}')
echo "$BLOCKS"

echo ""
echo "✅ Integration smoke test complete"
echo "   Data dir: $DATADIR (cleaned on exit)"
