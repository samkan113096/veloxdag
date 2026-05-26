#!/usr/bin/env bash
RPC="${VELOX_RPC:-http://127.0.0.1:8545}"
WALLET="${VELOX_WALLET:-$(ls -t "$(dirname "$0")/../chain"/wallet_*.json 2>/dev/null | head -1)}"
ADDR=""
if [[ -f "$WALLET" ]]; then
  ADDR=$(python3 -c "import json; print(json.load(open('$WALLET'))['address'])")
fi

while true; do
  TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  STATS=$(curl -sf "$RPC/api/stats" 2>/dev/null || echo "{}")
  BAL="?"
  if [[ -n "$ADDR" ]]; then
    BAL=$(curl -sf "$RPC" -H "Content-Type: application/json" \
      -d "{\"jsonrpc\":\"2.0\",\"method\":\"getbalance\",\"params\":{\"address\":\"$ADDR\"},\"id\":1}" \
      2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('formatted','?'))" 2>/dev/null || echo "?")
  fi
  BLOCKS=$(echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('blocks','?'))" 2>/dev/null || echo "?")
  MINED=$(echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('totalMined','?'))" 2>/dev/null || echo "?")
  PCT=$(echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('minedPercent','?'))" 2>/dev/null || echo "?")
  echo "[$TS] blocks=$BLOCKS network_mined=$MINED VELX (${PCT}% of 21M) | your_wallet=$BAL | addr=${ADDR:-none}"
  sleep 15
done
