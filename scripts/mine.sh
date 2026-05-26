#!/usr/bin/env bash
# Mine VELX — requires node running (./scripts/start-node.sh)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHAIN="$ROOT/chain"
RPC="${VELOX_RPC:-http://127.0.0.1:8545}"
THREADS="${VELOX_THREADS:-$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 4)}"
WALLET_FILE="${1:-}"

cd "$CHAIN"
if [[ ! -f bin/velox-miner ]]; then
  go build -o bin/velox-miner ./cmd/velox-miner
fi

if [[ -z "$WALLET_FILE" ]]; then
  # find newest wallet in chain dir or cwd
  WALLET_FILE=$(ls -t wallet_*.json 2>/dev/null | head -1 || true)
fi

if [[ -z "$WALLET_FILE" || ! -f "$WALLET_FILE" ]]; then
  echo "No wallet found. Create one first:"
  echo "  cd chain && ./bin/velox-wallet new"
  exit 1
fi

ADDR=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['address'])" "$WALLET_FILE")
echo "Mining to: $ADDR"
echo "RPC:       $RPC"
echo "Threads:   $THREADS"
echo ""
echo "Check balance (another terminal):"
echo "  ./scripts/balance.sh $WALLET_FILE"
echo ""

exec ./bin/velox-miner -rpc "$RPC" -miner "$ADDR" -threads "$THREADS"
