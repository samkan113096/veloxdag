#!/usr/bin/env bash
# Start VeloxDAG node (local or LAN)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHAIN="$ROOT/chain"
DATADIR="${VELOX_DATADIR:-$HOME/.veloxdag}"
PORT="${VELOX_PORT:-8545}"
LAN="${VELOX_LAN:-0}"

cd "$CHAIN"
if [[ ! -f bin/veloxd ]]; then
  echo "Building veloxd..."
  go build -o bin/veloxd ./cmd/veloxd
fi

ARGS=(-datadir "$DATADIR" -port "$PORT")
if [[ "$LAN" == "1" || "$LAN" == "true" ]]; then
  ARGS+=(-lan)
  echo "LAN mode: other devices on your WiFi can mine to this node"
fi

echo "Data: $DATADIR"
echo "RPC:  http://127.0.0.1:$PORT"
echo "Press Ctrl+C to stop"
exec ./bin/veloxd "${ARGS[@]}"
