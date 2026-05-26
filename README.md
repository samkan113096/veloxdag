# VeloxDAG (VELX) — Fair Launch PoW BlockDAG

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)
[![Premine](https://img.shields.io/badge/premine-0%25-success)](#)
[![Website](https://img.shields.io/badge/website-veloxdag.netlify.app-cyan)](https://veloxdag.netlify.app)

> **The fastest fair-launch Proof-of-Work BlockDAG. No premine. No ICO. No VC. Mine VELX and own the chain.**

## Key facts

| | |
|---|---|
| Ticker | **VELX** |
| Max supply | **21,000,000 VELX** (Bitcoin-style halving) |
| Block reward | **50 VELX** → halves every 210,000 blocks |
| Consensus | **SHA256 double-hash PoW** |
| Architecture | **BlockDAG** (up to 2 parents per block) |
| Premine | **0%** |
| ICO / VC | **None** |
| Launch | Fair launch — anyone can mine from block 1 |

## Quick start (mine VELX in 5 minutes)

```bash
# 1. Clone
git clone https://github.com/samkan113096/veloxdag.git
cd veloxdag/chain

# 2. Build (requires Go 1.22+)
go build -o bin/veloxd    ./cmd/veloxd
go build -o bin/velox-miner  ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet

# 3. Create wallet (saves address + key to wallet_*.json)
./bin/velox-wallet new

# 4. Start node (Terminal 1)
./bin/veloxd -port 8545

# 5. Start mining (Terminal 2)
./bin/velox-miner -miner velx1YOUR_ADDRESS -threads 8
```

Every block found = **50 VELX** paid to your address. Solo mine, keep 100%.

## One-script launch

```bash
# Start node + miner + monitor
./scripts/start-mining-stack.sh

# Check your balance
./scripts/balance.sh chain/wallet_XXXX.json

# Stop everything
./scripts/stop-mining-stack.sh
```

## Project structure

```
veloxdag/
├── chain/
│   ├── cmd/veloxd/          Node (JSON-RPC server, genesis, persistence)
│   ├── cmd/velox-miner/     CPU miner (multi-threaded SHA256 PoW)
│   ├── cmd/velox-wallet/    Wallet CLI (create, show address, export)
│   ├── pkg/chain/           State machine (DAG, balances, mempool)
│   ├── pkg/pow/             PoW engine (mine, verify, halving)
│   ├── pkg/rpc/             JSON-RPC + REST stats (CORS enabled)
│   └── pkg/types/           Types, BTC-style emission schedule
├── website/                 Next.js marketing site (SEO, 20 blogs)
├── netlify/functions/       Netlify proxy → your node's RPC
├── docs/
│   ├── litepaper/           22-section technical litepaper (~8,500 words)
│   ├── marketing/           90-day Twitter + Telegram + email templates
│   └── AUDIT.md             Quick security audit report
└── scripts/                 Start/stop/monitor/verify scripts
```

## RPC API

Run a node, then POST to `http://127.0.0.1:8545`:

| Method | Description |
|--------|-------------|
| `getblocktemplate` | Get mining template (`{miner: "velx1..."}`) |
| `submitblock` | Submit mined block |
| `getbalance` | Query address balance (`{address: "velx1..."}`) |
| `sendrawtransaction` | Broadcast transfer |
| `getchaininfo` | Chain stats (supply, blocks, halving) |

REST: `GET /api/stats` — JSON with supply, mined %, block height, difficulty.

## Tokenomics (Bitcoin-style)

```
Total supply:   21,000,000 VELX
Genesis premine: 0 VELX
Block reward:   50 VELX  (blocks 0–209,999)
                25 VELX  (blocks 210,000–419,999)
                12.5 VELX (blocks 420,000+)
                … halves every 210,000 blocks
```

Reward reaches zero after 64 halvings. All supply is earned through mining.

## Website

```bash
cd website && npm install && npm run dev
```

Live at **https://veloxdag.netlify.app** — includes:
- Live network stats (updates every 5s)
- Wallet page (check balance, send VELX)
- 20 blog posts, litepaper, mining tutorial, team

## Verify everything works

```bash
# Unit tests
cd chain && go test ./... -v

# Full local mining test
./scripts/verify-local.sh
```

## Roadmap

- [x] Fair-launch PoW node + miner + wallet
- [x] BlockDAG multi-parent headers
- [x] BTC-style halving (21M cap)
- [x] JSON-RPC API + CORS
- [x] Marketing website (Next.js, SEO, 20 blogs)
- [x] Litepaper (22 sections)
- [x] 90-day social content calendar
- [ ] P2P networking (shared mainnet)
- [ ] Transaction signature verification (Ed25519)
- [ ] Block explorer
- [ ] Mining pools
- [ ] Hardware wallet support
- [ ] WASM smart contracts

## Team

**Joseph Chen** — Lead Protocol & Security Engineer  
5+ years Web3 · Solidity · Foundry · DeFi · SecureFlow · MeowCoin · CatnipFarm  
[josephchendev.com](http://josephchendev.com/) · [@SelfLearnedDev2027](https://github.com/SelfLearnedDev2027)

## Disclaimer

Cryptocurrency mining and trading involve substantial risk. This software is provided for educational and experimental use. Not financial advice. Comply with applicable laws.

---

*VeloxDAG — built on-chain, launched fair.*
