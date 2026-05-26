import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mining Tutorial — Start Mining VELX Today",
  description:
    "Complete beginner's guide to mine VeloxDAG (VELX). Connect to the live mainnet seed node in under 10 minutes. macOS, Linux, and Windows supported.",
};

export default function TutorialPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose-velox">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
        Mine VELX — Start in 10 Minutes
      </h1>
      <p>
        VeloxDAG is a <strong>fair-launch</strong> CPU-mineable blockchain. There is no premine, no
        team allocation, no ICO. Every VELX in existence is earned by miners — including you.
      </p>
      <p>
        The <strong>official seed node is always live</strong> at{" "}
        <code className="text-cyan-300">66.94.106.193</code>. You don&apos;t need to run your own full
        node to mine — just point your miner at the seed node and go.
      </p>

      {/* ── Quickest path ── */}
      <div className="rounded-xl border border-cyan-700/40 bg-cyan-950/30 p-5 my-6">
        <p className="text-cyan-300 font-semibold mb-1">⚡ Fastest path — mine in 3 commands</p>
        <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200 mt-2">
{`git clone https://github.com/samkan113096/veloxdag.git
cd veloxdag/chain
go build -o bin/velox-miner ./cmd/velox-miner && go build -o bin/velox-wallet ./cmd/velox-wallet
./bin/velox-wallet new           # note the address printed (velx1...)
./bin/velox-miner -rpc http://66.94.106.193:8545 -miner velx1YOUR_ADDRESS -threads 4`}
        </pre>
        <p className="text-slate-400 text-sm mt-2">
          That&apos;s it. Your miner connects directly to the live mainnet. No node setup needed.
        </p>
      </div>

      {/* ── Requirements ── */}
      <h2>Requirements</h2>
      <ul>
        <li>macOS, Linux, or Windows (WSL2)</li>
        <li>
          <a href="https://go.dev/dl/" className="text-cyan-400 hover:underline">
            Go 1.22+
          </a>{" "}
          — verify with <code>go version</code>
        </li>
        <li>
          <a href="https://git-scm.com/downloads" className="text-cyan-400 hover:underline">
            Git
          </a>
        </li>
        <li>Any modern CPU — more cores = more hashes = more VELX</li>
      </ul>

      {/* ── Step 1 ── */}
      <h2>Step 1 — Install Go (if not already installed)</h2>
      <p>
        Go to{" "}
        <a href="https://go.dev/dl/" className="text-cyan-400 hover:underline">
          go.dev/dl
        </a>{" "}
        and download the installer for your OS. After install:
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`go version
# should print: go version go1.22.x ...`}
      </pre>

      {/* ── Step 2 ── */}
      <h2>Step 2 — Clone &amp; build</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`git clone https://github.com/samkan113096/veloxdag.git
cd veloxdag/chain

# Build the miner and wallet (takes ~30 seconds first time):
go build -o bin/velox-miner  ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet

# Optional — build the full node if you want to run your own:
go build -o bin/veloxd ./cmd/veloxd`}
      </pre>

      {/* ── Step 3 ── */}
      <h2>Step 3 — Create your wallet address</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`./bin/velox-wallet new

# Output example:
#   New VeloxDAG wallet created!
#   Address:  velx1a3f2e...
#   Saved to: wallet_a3f2e.json`}
      </pre>
      <p>
        <strong>Copy your address</strong> (starts with <code>velx1</code>). That&apos;s where
        your block rewards land.
      </p>
      <p>
        Alternatively, create a wallet directly in your browser with full seed phrase backup on the{" "}
        <a href="/wallet" className="text-cyan-400 hover:underline">
          Wallet page
        </a>
        .
      </p>
      <p className="text-amber-400 text-sm">
        ⚠ Back up <code>wallet_*.json</code>. It holds your private key — lose it and you lose
        access to your coins. Never share it.
      </p>

      {/* ── Step 4 ── */}
      <h2>Step 4 — Start mining (connect to mainnet seed node)</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Mine directly against the always-on seed node (recommended for beginners):
./bin/velox-miner -rpc http://66.94.106.193:8545 -miner velx1YOUR_ADDRESS -threads 4

# Use all your CPU cores for maximum hash rate:
./bin/velox-miner -rpc http://66.94.106.193:8545 -miner velx1YOUR_ADDRESS -threads $(nproc)
#   macOS/Linux: $(nproc) auto-fills your core count
#   Windows:     replace $(nproc) with a number, e.g. -threads 8`}
      </pre>
      <p>
        When a block is found you&apos;ll see:
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-emerald-300">
{`BLOCK FOUND! height=142 hash=0000003f... reward=50.00000000 VELX`}
      </pre>
      <p>
        <strong>50 VELX</strong> is credited directly to your address — no pool, no fee, no middleman.
        The reward halves every 210,000 blocks (same schedule as Bitcoin).
      </p>

      {/* ── Difficulty ── */}
      <h2>How difficulty works (Bitcoin-identical)</h2>
      <p>
        VeloxDAG uses the <strong>exact same difficulty algorithm as Bitcoin</strong>:
      </p>
      <ul>
        <li>Target block time: <strong>60 seconds</strong></li>
        <li>
          Difficulty retargets every <strong>2,016 blocks</strong> (~1.4 days at target pace) — the
          same 2,016-block window Bitcoin uses
        </li>
        <li>
          Adjustment is capped at <strong>±4×</strong> per window — prevents sudden spikes when many
          miners join or leave
        </li>
        <li>
          As more miners join, difficulty rises slowly over multiple windows; if miners leave, it
          falls just as gradually
        </li>
      </ul>
      <p>
        This means early miners enjoy <strong>lower difficulty</strong> (more blocks per hour) and
        the <strong>full 50 VELX reward</strong> before the first halving at block 210,000.
      </p>

      {/* ── Check balance ── */}
      <h2>Check your balance</h2>
      <p>Three ways to check how much VELX you&apos;ve earned:</p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# 1. Website wallet (easiest):
#    Go to https://veloxdag.netlify.app/wallet → Access wallet → enter your address

# 2. RPC query against the seed node:
curl http://66.94.106.193:8545 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"getbalance","params":{"address":"velx1YOUR_ADDRESS"},"id":1}'

# 3. CLI (if you have velox-wallet built):
./bin/velox-wallet balance velx1YOUR_ADDRESS`}
      </pre>

      {/* ── Run your own node ── */}
      <h2>Optional — run your own full node</h2>
      <p>
        Running your own node makes you fully independent and contributes to network decentralisation.
        Connect it to the seed node so you sync the same chain:
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Start your node, syncing from the official seed:
./bin/veloxd -datadir ~/.veloxdag -port 8545 -lan -seeds 66.94.106.193:37373

# Verify it's running:
curl http://127.0.0.1:8545/health
# {"status":"ok","chain":"VeloxDAG","peers":1}

# Then mine against your own node:
./bin/velox-miner -rpc http://127.0.0.1:8545 -miner velx1YOUR_ADDRESS -threads 4`}
      </pre>

      {/* ── VPS ── */}
      <h2>24/7 VPS mining (earn while you sleep)</h2>
      <p>
        For maximum rewards, run on an always-on server (DigitalOcean, Hetzner, AWS Lightsail, etc.):
      </p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Ubuntu / Debian VPS setup:
sudo apt-get update && sudo apt-get install -y git

# Install Go 1.22 (apt version is often outdated):
curl -sL https://go.dev/dl/go1.22.5.linux-amd64.tar.gz | sudo tar -C /usr/local -xz
export PATH=$PATH:/usr/local/go/bin   # add to ~/.bashrc for persistence

# Clone and build:
git clone https://github.com/samkan113096/veloxdag.git
cd veloxdag/chain
go build -o bin/velox-miner ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet
./bin/velox-wallet new    # save your address!

# Mine in background (survives logout):
nohup ./bin/velox-miner -rpc http://66.94.106.193:8545 \\
  -miner velx1YOUR_ADDRESS -threads $(nproc) > miner.log 2>&1 &

# Watch the log:
tail -f miner.log`}
      </pre>

      {/* ── Peers ── */}
      <h2>Network information</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`# Live chain stats (block count, difficulty, mined VELX):
curl http://66.94.106.193:8545/api/stats

# Latest blocks / tips:
curl http://66.94.106.193:8545 \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"getchaininfo","params":{},"id":1}'`}
      </pre>

      {/* ── Tips ── */}
      <h2>Tips for maximum earnings</h2>
      <ul>
        <li>
          Set <code>-threads</code> to your CPU core count — use <code>nproc</code> on Linux /
          macOS, <code>echo %NUMBER_OF_PROCESSORS%</code> on Windows
        </li>
        <li>
          Mine on a VPS 24/7 — cloud servers have stable internet and uptime; even a $5/month
          instance earns blocks
        </li>
        <li>
          Join early — difficulty starts low and rises gradually (2,016-block window). The first
          miners earn the most per CPU cycle before the network grows
        </li>
        <li>
          First halving at block 210,000 (~5 months). Between now and then every block pays{" "}
          <strong>50 VELX</strong>
        </li>
        <li>
          Join the{" "}
          <a href="https://t.me/VeloxDAG" className="text-cyan-400 hover:underline">
            Telegram community
          </a>{" "}
          for updates, support, and extra peer addresses
        </li>
        <li>
          Read the{" "}
          <a href="/litepaper" className="text-cyan-400 hover:underline">
            Litepaper
          </a>{" "}
          for full tokenomics, halving schedule, and DAG architecture details
        </li>
      </ul>
    </article>
  );
}
