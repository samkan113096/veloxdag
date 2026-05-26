# VeloxDAG — Fair Launch PoW BlockDAG

**VELX** · SHA256 Proof-of-Work · No Premine · No ICO · No VC

VeloxDAG is a fair-launch BlockDAG blockchain inspired by high-throughput PoW networks like Kaspa and BlockDAG. Every VELX coin is earned through mining — zero team allocation at genesis.

## Quick Start

### One-command verify (recommended first)

```bash
./scripts/verify-local.sh
```

### Local mining (this machine)

**Terminal 1 — start node:**
```bash
./scripts/start-node.sh
```

**Terminal 2 — create wallet & mine:**
```bash
cd chain && ./bin/velox-wallet new
cd .. && ./scripts/mine.sh chain/wallet_XXXX.json
```

**Terminal 3 — check balance:**
```bash
./scripts/balance.sh chain/wallet_XXXX.json
```

### Local network (same WiFi — phone/laptop #2)

**On the machine running the node:**
```bash
VELOX_LAN=1 ./scripts/start-node.sh
```
The node prints LAN URLs like `http://192.168.1.5:8545`.

**On another device** (after copying miner binary or building from source):
```bash
./bin/velox-miner -rpc http://192.168.1.5:8545 -miner velx1YOUR_ADDRESS -threads 4
```

Everyone mining to the same node shares **one chain** and fair-launch rewards.

### Manual build

```bash
cd chain
go build -o bin/veloxd ./cmd/veloxd
go build -o bin/velox-miner ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet
```

### 2. Run a node

```bash
./bin/veloxd -datadir ~/.veloxdag -port 8545
```

### 3. Create a wallet

```bash
./bin/velox-wallet new
# Saves wallet_<id>.json with address (velx1...) and private key
```

### 4. Start mining

```bash
./bin/velox-miner -miner velx1YOUR_ADDRESS -threads 8
```

Each block found pays **50 VELX** to your miner address (coinbase reward).

## RPC API

| Method | Description |
|--------|-------------|
| `getblocktemplate` | Get block template for mining (`miner` param required) |
| `submitblock` | Submit mined block |
| `getbalance` | Query balance by address |
| `sendrawtransaction` | Broadcast transaction to mempool |
| `getchaininfo` | Chain stats |
| `gettips` | Current DAG tips |

Example:

```bash
curl -s http://127.0.0.1:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getchaininfo","params":{},"id":1}'
```

## Fair Launch Guarantees

- **0% premine** — genesis block has no coin allocation
- **100% PoW emission** — all supply from block rewards
- **50 VELX** per block (initial reward)
- **BlockDAG** — blocks reference up to 2 parents for parallel throughput
- **CPU-minable** at launch — ASIC-resistant difficulty ramp planned via community governance

## Network Ports

| Service | Default |
|---------|---------|
| RPC/HTTP | 8545 |
| P2P (future) | 37373 |

## Project Links

- Website: https://veloxdag.com (configure your domain)
- Litepaper: `/docs/litepaper/VELOXDAG-LITEPAPER.md`
- Mining guide: https://veloxdag.com/tutorial
