import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About VeloxDAG",
  description:
    "Learn about VeloxDAG — a fair-launch Proof-of-Work BlockDAG with zero premine, 50 VELX block rewards, and CPU mining.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose-velox">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
        About VeloxDAG
      </h1>
      <p>
        VeloxDAG is a next-generation <strong>Proof-of-Work BlockDAG</strong> blockchain
        built for miners, by miners. The name combines <em>velocity</em> (speed) with{" "}
        <em>DAG</em> (directed acyclic graph) — our answer to the throughput limits of
        linear blockchains without abandoning Nakamoto consensus.
      </p>
      <h2>Our mission</h2>
      <p>
        We believe the next wave of cryptocurrency value will accrue to{" "}
        <strong>fair-launch PoW networks</strong> that combine Kaspa-level speed with
        tokenomics that don&apos;t punish retail participants. VeloxDAG launches with{" "}
        <strong>zero premine, zero ICO, and zero VC allocation</strong>.
      </p>
      <h2>What makes us different</h2>
      <ul>
        <li><strong>BlockDAG architecture</strong> — blocks reference up to two parents for parallel confirmation</li>
        <li><strong>SHA256 PoW</strong> — battle-tested mining algorithm at launch</li>
        <li><strong>50 VELX per block</strong> — generous emission to early miners</li>
        <li><strong>Open source stack</strong> — node (veloxd), miner (velox-miner), wallet (velox-wallet)</li>
        <li><strong>No gatekeepers</strong> — solo mine from day one</li>
      </ul>
      <h2>The fair launch promise</h2>
      <p>
        Every VELX token in existence is created through mining or purchased from a miner.
        There is no genesis allocation to founders, advisors, or funds. If you want VELX,
        you earn it with hash power — the same way Bitcoin intended.
      </p>
      <h2>Contact & community</h2>
      <p>
        Email: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        <br />
        Telegram: <a href={siteConfig.telegram}>t.me/VeloxDAG</a>
        <br />
        Twitter: <a href={siteConfig.twitter}>@VeloxDAG</a>
      </p>
    </article>
  );
}
