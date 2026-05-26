import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mining Tutorial — Start Mining VELX",
  description:
    "Step-by-step guide to mine VeloxDAG (VELX): build the node, create a wallet, run velox-miner, and earn 50 VELX block rewards. Works on macOS, Linux, Windows.",
};

export default function TutorialPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose-velox">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
        Mining Tutorial
      </h1>
      <p>
        Mine <strong>VELX</strong> on the VeloxDAG fair-launch mainnet.
        Estimated setup time: <strong>10–15 minutes</strong>. No registration. No KYC.
        Every coin is earned — zero premine, zero team allocation.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>macOS, Linux, or Windows (WSL2)</li>
        <li>
          <a href="https://go.dev/dl/" className="text-cyan-400 hover:underline">
            Go 1.22+
          </a>{" "}
          installed
        </li>
        <li>
          <a href="https://git-scm.com/downloads" className="text-cyan-400 hover:underline">
            Git
          </a>{" "}
          installed
        </li>
        <li>4 GB RAM minimum, 8 GB recommended</li>
        <li>Internet connection</li>
      </ul>

      <h2>Step 1 — Clone &amp; build</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`git clone https://github.com/samkan113096/veloxdag.git
cd veloxdag/chain
go build -o bin/veloxd    ./cmd/veloxd
go build -o bin/velox-miner  ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet`}
      </pre>
      <p>
        Source code:{" "}
        <a
          href="https://github.com/samkan113096/veloxdag"
          className="text-cyan-400 hover:underline"
        >
          github.com/samkan113096/veloxdag
        </a>
      </p>

      <h2>Step 2 — Create your wallet</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`cd veloxdag/chain
./bin/velox-wallet new
# Output:
#   New VeloxDAG wallet created!
#   Address:  velx1abc123...
#   Saved to: wallet_abc123.json`}
      </pre>
      <p>
        <strong>⚠️ Back up your wallet file.</strong> It holds your private key — anyone with it can
        spend your VELX. Never share it. Store a copy offline.
      </p>

      <h2>Step 3 — Start your node</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Start a local node (only your machine):
./bin/veloxd -datadir ~/.veloxdag -port 8545

# Start and accept connections from your whole network:
./bin/veloxd -datadir ~/.veloxdag -port 8545 -lan

# Connect to another peer on the network (fair-launch shared chain):
./bin/veloxd -datadir ~/.veloxdag -port 8545 -lan -seeds PEER_IP:37373`}
      </pre>
      <p>Verify the node is live:</p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`curl http://127.0.0.1:8545/health
# {"status":"ok","chain":"VeloxDAG","peers":0}

curl http://127.0.0.1:8545/api/stats
# returns block count, difficulty, total mined, etc.`}
      </pre>

      <h2>Step 4 — Start mining</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Mine on your own node (default: http://127.0.0.1:8545)
./bin/velox-miner -miner velx1YOUR_ADDRESS -threads 8

# Mine on someone else's node on the same Wi-Fi:
./bin/velox-miner -rpc http://192.168.x.x:8545 -miner velx1YOUR_ADDRESS -threads 8`}
      </pre>
      <p>
        When a block is found you&apos;ll see{" "}
        <code className="text-cyan-300">BLOCK FOUND!</code> and{" "}
        <strong>50 VELX</strong> lands directly in your address — no pool, no fee.
        Each block takes roughly <strong>60 seconds</strong> at target difficulty
        (retargets every 144 blocks, just like Bitcoin).
      </p>

      <h2>Check your balance</h2>
      <p>
        Use the{" "}
        <a href="/wallet" className="text-cyan-400 hover:underline">
          Wallet page
        </a>{" "}
        on this site to check your balance and send VELX to any address, or query the RPC
        directly:
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`curl http://127.0.0.1:8545 -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"getbalance","params":{"address":"velx1..."},"id":1}'`}
      </pre>

      <h2>Connect peers (join the fair-launch network)</h2>
      <p>
        To mine on the <em>shared</em> mainnet, connect your node to the official seed node:
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Connect to the official VeloxDAG seed node at launch:
./bin/veloxd -datadir ~/.veloxdag -port 8545 -lan -seeds 66.94.106.193:37373

# Then mine against it:
./bin/velox-miner -rpc http://66.94.106.193:8545 -miner velx1YOUR_ADDRESS -threads 8`}
      </pre>
      <p>
        Or add a peer to your already-running node:
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Add a peer to your running node:
curl http://127.0.0.1:8545 -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"addpeer","params":{"addr":"PEER_IP:37373"},"id":1}'

# List connected peers:
curl http://127.0.0.1:8545 -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"getpeerinfo","params":{},"id":1}'`}
      </pre>

      <h2>Quick-start script (macOS / Linux)</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# From repo root — starts node + miner + monitor in background
VELOX_LAN=1 ./scripts/start-mining-stack.sh

# Join a peer at the same time:
VELOX_LAN=1 VELOX_SEEDS=PEER_IP:37373 ./scripts/start-mining-stack.sh

# Stop everything:
./scripts/stop-mining-stack.sh`}
      </pre>

      <h2>Run on a VPS (24/7 mining)</h2>
      <p>
        For maximum yield, run your node and miner on an always-on server (DigitalOcean, Hetzner,
        AWS Lightsail, etc.):
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# On your VPS (Ubuntu/Debian):
sudo apt-get update && sudo apt-get install -y git golang-go
git clone https://github.com/samkan113096/veloxdag.git
cd veloxdag/chain
go build -o bin/veloxd ./cmd/veloxd
go build -o bin/velox-miner ./cmd/velox-miner
./bin/velox-wallet new            # save the address shown

# Start node (background):
nohup ./bin/veloxd -datadir ~/.veloxdag -port 8545 -lan &

# Start miner (background):
nohup ./bin/velox-miner -miner velx1YOUR_ADDRESS -threads $(nproc) &`}
      </pre>

      <h2>Tips for success</h2>
      <ul>
        <li>
          Match <code>-threads</code> to your CPU core count for max hash rate (use{" "}
          <code>nproc</code> on Linux)
        </li>
        <li>Keep your node running 24/7 on a VPS to earn blocks while you sleep</li>
        <li>
          Halving happens every 210,000 blocks — early miners earn the highest rewards (50 VELX/block)
        </li>
        <li>
          Join{" "}
          <a href="https://t.me/VeloxDAG" className="text-cyan-400 hover:underline">
            Telegram
          </a>{" "}
          for peer IPs, network updates, and the community
        </li>
        <li>
          Read the{" "}
          <a href="/litepaper" className="text-cyan-400 hover:underline">
            Litepaper
          </a>{" "}
          for full tokenomics and halving schedule
        </li>
      </ul>
    </article>
  );
}
