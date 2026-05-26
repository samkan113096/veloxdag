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
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>macOS, Linux, or Windows (WSL2)</li>
        <li><a href="https://go.dev/dl/" className="text-cyan-400 hover:underline">Go 1.22+</a> installed</li>
        <li>8 GB RAM recommended</li>
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

      <h2>Step 2 — Create your wallet</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`./bin/velox-wallet new
# Prints: velx1... address
# Saves:  wallet_XXXX.json  ← back this up securely!`}
      </pre>
      <p>
        <strong>⚠️ Back up your wallet file.</strong> It contains your private key. Never share it.
      </p>

      <h2>Step 3 — Start your node</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Solo (local machine only):
./bin/veloxd -datadir ~/.veloxdag -port 8545

# LAN / open to your network:
./bin/veloxd -datadir ~/.veloxdag -port 8545 -lan

# Connect to the VeloxDAG mainnet seed:
./bin/veloxd -datadir ~/.veloxdag -port 8545 -lan -seeds seed.veloxdag.com:37373`}
      </pre>
      <p>Verify it&apos;s running:</p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`curl http://127.0.0.1:8545/health
# → {"status":"ok","chain":"VeloxDAG","peers":0}`}
      </pre>

      <h2>Step 4 — Start mining</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`./bin/velox-miner -miner velx1YOUR_ADDRESS -threads 8

# Mine to someone else's node on same WiFi:
./bin/velox-miner -rpc http://192.168.x.x:8545 -miner velx1YOUR_ADDRESS -threads 8`}
      </pre>
      <p>
        When a block is found you&apos;ll see <code>BLOCK FOUND!</code> and receive{" "}
        <strong>50 VELX</strong> instantly. All rewards go direct to your address — no pool fees.
      </p>

      <h2>Check your balance</h2>
      <p>
        Use the <a href="/wallet" className="text-cyan-400 hover:underline">Wallet page</a> on this
        site, or query the RPC directly:
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`curl http://127.0.0.1:8545 -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"getbalance","params":{"address":"velx1..."},"id":1}'`}
      </pre>

      <h2>Connect peers (fair-launch network)</h2>
      <p>
        To join the shared mainnet, start your node with <code>-seeds</code> pointing at a running peer.
        Everyone pointing at the same seed will mine <em>one chain</em> and share the fair launch.
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Add a peer after starting:
curl http://127.0.0.1:8545 -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"addpeer","params":{"addr":"PEER_IP:37373"},"id":1}'

# See connected peers:
curl http://127.0.0.1:8545 -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"getpeerinfo","params":{},"id":1}'`}
      </pre>

      <h2>Quick-start script (macOS/Linux)</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# From the repo root — starts node + miner + monitor
VELOX_LAN=1 ./scripts/start-mining-stack.sh

# To join another peer:
VELOX_LAN=1 VELOX_SEEDS=PEER_IP:37373 ./scripts/start-mining-stack.sh`}
      </pre>

      <h2>Tips for success</h2>
      <ul>
        <li>Match <code>-threads</code> to your CPU core count for max hash rate</li>
        <li>Run on a 24/7 VPS to accumulate blocks while you sleep</li>
        <li>Join <a href="https://t.me/VeloxDAG" className="text-cyan-400 hover:underline">Telegram</a> for seed node IPs and network updates</li>
        <li>Read the <a href="/litepaper" className="text-cyan-400 hover:underline">Litepaper</a> for tokenomics and halving schedule</li>
        <li>Source code: <a href="https://github.com/samkan113096/veloxdag" className="text-cyan-400 hover:underline">github.com/samkan113096/veloxdag</a></li>
      </ul>
    </article>
  );
}
