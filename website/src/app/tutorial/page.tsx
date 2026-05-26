import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mining Tutorial — Start Mining VELX",
  description:
    "Step-by-step guide to mine VeloxDAG (VELX): build the node, create a wallet, run velox-miner, and earn block rewards.",
};

export default function TutorialPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose-velox">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
        Mining Tutorial
      </h1>
      <p>
        This guide walks you through mining <strong>VELX</strong> on the VeloxDAG
        fair-launch mainnet. Estimated setup time: <strong>10–15 minutes</strong>.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>macOS, Linux, or Windows with WSL</li>
        <li>Go 1.22+ installed</li>
        <li>8 GB RAM recommended</li>
        <li>Internet connection</li>
      </ul>

      <h2>Step 1: Clone & build</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`git clone https://github.com/veloxdag/veloxdag.git
cd veloxdag/chain
go build -o bin/veloxd ./cmd/veloxd
go build -o bin/velox-miner ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet`}
      </pre>

      <h2>Step 2: Create wallet</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`./bin/velox-wallet new
# Output: velx1... address + wallet JSON file`}
      </pre>
      <p>
        <strong>⚠️ Back up your wallet file.</strong> Never share your private key.
      </p>

      <h2>Step 3: Start the node</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`./bin/veloxd -datadir ~/.veloxdag -port 8545`}
      </pre>
      <p>Verify the node is running:</p>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`curl -s http://127.0.0.1:8545/health`}
      </pre>

      <h2>Step 4: Start mining</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`./bin/velox-miner -miner velx1YOUR_ADDRESS -threads 8`}
      </pre>
      <p>
        When you find a block, you&apos;ll see <code>BLOCK FOUND!</code> in the logs
        and receive <strong>50 VELX</strong> to your miner address.
      </p>

      <h2>Check your balance</h2>
      <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-cyan-200">
{`curl -s http://127.0.0.1:8545 -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","method":"getbalance","params":{"address":"velx1..."},"id":1}'`}
      </pre>

      <h2>Tips for success</h2>
      <ul>
        <li>Use all CPU cores with <code>-threads</code> matching your core count</li>
        <li>Run the node 24/7 on a VPS for stable mining</li>
        <li>Join Telegram for network updates and pool announcements</li>
        <li>Read the Litepaper for tokenomics and security details</li>
      </ul>
    </article>
  );
}
