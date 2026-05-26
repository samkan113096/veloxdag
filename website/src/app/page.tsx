import Link from "next/link";
import { LiveNetworkStats } from "@/components/LiveNetworkStats";
import { siteConfig } from "@/lib/site-config";

const stats = [
  { label: "Premine", value: "0%" },
  { label: "Max Supply", value: "21M VELX" },
  { label: "Block Reward", value: "50 VELX" },
  { label: "Algorithm", value: "SHA256 PoW" },
];

const features = [
  {
    title: "Fair Launch Only",
    desc: "No ICO, no VC, no team allocation at genesis. Every VELX is mined into existence.",
  },
  {
    title: "BlockDAG Speed",
    desc: "Multi-parent blocks enable parallel confirmation — throughput linear chains can't match.",
  },
  {
    title: "CPU Mineable",
    desc: "Run velox-miner on your laptop or VPS. Solo mine and keep 100% of block rewards.",
  },
  {
    title: "Open Source",
    desc: "Full node, wallet, and miner code published. Verify, audit, and run yourself.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 py-24 text-center glow-orb">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-cyan-400">
            Fair Launch · Proof of Work · BlockDAG
          </p>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            <span className="bg-gradient-to-r from-cyan-300 via-white to-violet-400 bg-clip-text text-transparent">
              The fastest fair-launch PoW chain
            </span>
            <br />
            <span className="text-slate-300">you can mine today</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/tutorial"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25"
            >
              Start Mining VELX
            </Link>
            <Link
              href="/litepaper"
              className="rounded-xl border border-cyan-500/40 px-8 py-3 font-semibold text-cyan-300 hover:bg-cyan-500/10"
            >
              Read Litepaper
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-white mb-8">
          Live network stats
        </h2>
        <LiveNetworkStats />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center"
            >
              <p className="text-2xl font-bold text-cyan-400">{s.value}</p>
              <p className="mt-1 text-sm text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-white">
          Why miners choose VeloxDAG
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/30 p-8"
            >
              <h3 className="text-xl font-semibold text-cyan-300">{f.title}</h3>
              <p className="mt-3 text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-white">Join the hash revolution</h2>
        <p className="mt-4 text-slate-400">
          Kaspa proved fast PoW wins. BlockDAG proved the narrative. VeloxDAG gives you a fair entry.
        </p>
        <Link href="/blog" className="mt-8 inline-block text-cyan-400 hover:underline">
          Read 20 articles on mining, security & tokenomics →
        </Link>
      </section>
    </>
  );
}
