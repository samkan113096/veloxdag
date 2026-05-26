#!/usr/bin/env bash
# Verify VeloxDAG works on this machine (build, node, mine, balance, restart)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHAIN="$ROOT/chain"
DATADIR=$(mktemp -d)
PORT=$((19000 + RANDOM % 1000))
export VELOX_RPC="http://127.0.0.1:$PORT"

cleanup() {
  pkill -f "veloxd -datadir $DATADIR" 2>/dev/null || true
  rm -rf "$DATADIR"
}
trap cleanup EXIT

cd "$CHAIN"
echo "=== 1. Build ==="
go build -o bin/veloxd ./cmd/veloxd
go build -o bin/velox-miner ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet
echo "OK"

echo "=== 2. Unit tests ==="
go test ./... -count=1
echo "OK"

echo "=== 3. Start node ==="
./bin/veloxd -datadir "$DATADIR" -port "$PORT" &
sleep 2
curl -sf "$VELOX_RPC/health" | grep -q VeloxDAG
echo "OK"

echo "=== 4. Fair launch check ==="
INFO=$(curl -sf "$VELOX_RPC" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getchaininfo","params":{},"id":1}')
echo "$INFO" | grep -q '"fairLaunch":true'
echo "$INFO" | grep -q '"blocks":1'
SUPPLY=$(echo "$INFO" | python3 -c "import sys,json; r=json.load(sys.stdin)['result']; print(r.get('totalSupply',''))")
[[ "$SUPPLY" == "0.00000000" ]] || { echo "FAIL: genesis should have 0 supply, got $SUPPLY"; exit 1; }
echo "OK (0 premine at genesis)"

echo "=== 5. Create wallet & mine ==="
./bin/velox-wallet new
WALLET=$(ls -t wallet_*.json | head -1)
ADDR=$(python3 -c "import json; print(json.load(open('$WALLET'))['address'])")
./bin/velox-miner -rpc "$VELOX_RPC" -miner "$ADDR" -threads 2 &
MPID=$!
for i in $(seq 1 30); do
  BAL=$(curl -sf "$VELOX_RPC" -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"getbalance\",\"params\":{\"address\":\"$ADDR\"},\"id\":2}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['balance'])" 2>/dev/null || echo 0)
  if [[ "$BAL" != "0" ]]; then
    echo "Mined balance after ${i}s: $(python3 -c "print($BAL/1e8)") VELX"
    break
  fi
  sleep 1
done
kill $MPID 2>/dev/null || true
wait $MPID 2>/dev/null || true
sleep 2
BAL=$(curl -sf "$VELOX_RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"getbalance\",\"params\":{\"address\":\"$ADDR\"},\"id\":2}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['balance'])" 2>/dev/null || echo 0)
[[ "$BAL" != "0" ]] || { echo "FAIL: no coins mined"; exit 1; }
echo "OK ($(python3 -c "print($BAL/1e8)") VELX mined)"

echo "=== 6. Restart node (persistence) ==="
NODEPID=$(pgrep -f "veloxd -datadir $DATADIR" | head -1)
kill "$NODEPID" 2>/dev/null || true
wait "$NODEPID" 2>/dev/null || true
sleep 1
./bin/veloxd -datadir "$DATADIR" -port "$PORT" &
sleep 2
BAL2=$(curl -sf "$VELOX_RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"getbalance\",\"params\":{\"address\":\"$ADDR\"},\"id\":3}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['balance'])")
[[ "$BAL2" == "$BAL" ]] || { echo "FAIL: balance after restart $BAL2 != $BAL (expected same)"; exit 1; }
echo "OK (balance persisted: $(python3 -c "print($BAL2/1e8)") VELX)"

echo ""
echo "✅ VeloxDAG local mining works on this machine."
echo "   Next: ./scripts/start-node.sh  then  ./scripts/mine.sh"
