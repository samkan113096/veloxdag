import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
  description:
    "Meet the VeloxDAG core team including Sam Kan, Lead Protocol Engineer with 5+ years Web3 and mainnet experience.",
};

const team = [
  {
    name: "Sam Kan",
    role: "Lead Protocol & Security Engineer",
    bio: `Sam is an independent Web3 developer with 5+ years building production software and five shipped mainnet projects. He specializes in Solidity smart contracts, DeFi protocol design, and security-first engineering with Foundry fuzz testing and Slither analysis.

At VeloxDAG, Sam leads protocol security review, RPC hardening, mining infrastructure, and the WASM smart contract roadmap. His work includes SecureFlow (AI-powered contract security scanning), MeowCoin (ERC-20 reference), CatnipFarm (Synthetix-style staking), PawClaim (Merkle airdrops), and CatVesting (linear vesting).

Sam believes fair-launch PoW is the antidote to VC-captured tokenomics — and ships code accordingly.`,
    tags: ["Solidity", "Foundry", "BlockDAG", "Security", "DeFi"],
  },
];

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
        Team
      </h1>
      <p className="mt-4 text-slate-400">
        VeloxDAG is built by engineers who ship on mainnet — not slide decks. Core contributors mine VELX like everyone else.
      </p>
      <div className="mt-12 space-y-8">
        {team.map((member) => (
          <div
            key={member.name}
            className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 to-slate-900/40 p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{member.name}</h2>
                <p className="text-cyan-400">{member.role}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {member.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-6 text-slate-300 leading-relaxed whitespace-pre-line">{member.bio}</p>
          </div>
        ))}
      </div>
      <p className="mt-12 text-center text-sm text-slate-500">
        Want to contribute? Join our{" "}
        <a href="https://t.me/VeloxDAG" className="text-cyan-400 hover:underline">Telegram</a>
      </p>
    </div>
  );
}

