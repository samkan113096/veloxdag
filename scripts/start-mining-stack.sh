#!/usr/bin/env bash
# Start VeloxDAG node + miner + monitor (BTC-style continuous mining)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHAIN="$ROOT/chain"
LOGS="$ROOT/logs"
DATADIR="${VELOX_DATADIR:-$HOME/.veloxdag}"
PORT="${VELOX_PORT:-8545}"
WALLET="${VELOX_WALLET:-}"
THREADS="${VELOX_THREADS:-$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 8)}"
LAN="${VELOX_LAN:-1}"

mkdir -p "$LOGS"

cd "$CHAIN"
for bin in veloxd velox-miner velox-wallet; do
  [[ -f bin/$bin ]] || go build -o "bin/$bin" "./cmd/$bin"
done

# Auto-discover wallet: VELOX_WALLET env var → newest wallet_*.json in chain/ → create one
if [[ -z "$WALLET" ]]; then
  NEWEST=$(ls -t wallet_*.json 2>/dev/null | head -1 || true)
  if [[ -n "$NEWEST" ]]; then
    WALLET="$CHAIN/$NEWEST"
  fi
fi

if [[ -z "$WALLET" || ! -f "$WALLET" ]]; then
  echo "No wallet found — creating one..."
  ./bin/velox-wallet new
  WALLET="$CHAIN/$(ls -t wallet_*.json | head -1)"
fi

ADDR=$(python3 -c "import json; print(json.load(open('$WALLET'))['address'])")

# Stop old processes
pkill -f "veloxd -datadir $DATADIR" 2>/dev/null || true
pkill -f "velox-miner.*$PORT" 2>/dev/null || true
sleep 1

echo "Starting VeloxDAG node (datadir: $DATADIR, port: $PORT)"
NODE_ARGS=(-datadir "$DATADIR" -port "$PORT" -p2pport 37373)
[[ "$LAN" == "1" || "$LAN" == "true" ]] && NODE_ARGS+=(-lan)

SEEDS="${VELOX_SEEDS:-}"
[[ -n "$SEEDS" ]] && NODE_ARGS+=(-seeds "$SEEDS")

nohup ./bin/veloxd "${NODE_ARGS[@]}" >> "$LOGS/node.log" 2>&1 &
echo $! > "$LOGS/node.pid"
sleep 2

if ! curl -sf "http://127.0.0.1:$PORT/health" | grep -q VeloxDAG; then
  echo "Node failed to start. See $LOGS/node.log"
  tail -20 "$LOGS/node.log"
  exit 1
fi

echo "Starting miner → $ADDR ($THREADS threads)"
nohup ./bin/velox-miner -rpc "http://127.0.0.1:$PORT" -miner "$ADDR" -threads "$THREADS" \
  >> "$LOGS/miner.log" 2>&1 &
echo $! > "$LOGS/miner.pid"

echo "Starting monitor (logs every 15s → $LOGS/monitor.log)"
nohup "$ROOT/scripts/monitor.sh" >> "$LOGS/monitor.log" 2>&1 &
echo $! > "$LOGS/monitor.pid"

echo ""
echo "✅ Mining stack running"
echo "   Wallet:  $WALLET"
echo "   Address: $ADDR"
echo "   RPC:     http://127.0.0.1:$PORT"
echo "   P2P:     port 37373 (for peer connections)"
echo "   To join another node: VELOX_SEEDS=IP:37373 ./scripts/start-mining-stack.sh"
echo "   Logs:    $LOGS/"
echo ""
echo "   Check balance: $ROOT/scripts/balance.sh $WALLET"
echo "   Website wallet page: set RPC to http://127.0.0.1:$PORT (or your LAN IP)"
echo "   Stop: $ROOT/scripts/stop-mining-stack.sh"
