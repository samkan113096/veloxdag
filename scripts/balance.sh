#!/usr/bin/env bash
# Query VELX balance from running node
set -euo pipefail
RPC="${VELOX_RPC:-http://127.0.0.1:8545}"
WALLET="${1:-}"

if [[ -z "$WALLET" ]]; then
  WALLET=$(ls -t wallet_*.json 2>/dev/null | head -1 || true)
fi
if [[ -z "$WALLET" || ! -f "$WALLET" ]]; then
  echo "Usage: balance.sh [wallet.json]"
  exit 1
fi

ADDR=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['address'])" "$WALLET")
curl -sf "$RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"getbalance\",\"params\":{\"address\":\"$ADDR\"},\"id\":1}" | python3 -m json.tool
