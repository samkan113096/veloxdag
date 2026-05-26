"use client";

import { useEffect, useState } from "react";
import { fetchStats, type NetworkStats } from "@/lib/rpc";

const PROXY = "/.netlify/functions/velox-rpc";

export function LiveNetworkStats() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await fetchStats(PROXY);
      if (s) {
        setStats(s);
        setLive(s.status === "live");
        setError(false);
      } else {
        setError(true);
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  if (!stats) {
    if (error) {
      return (
        <div className="rounded-xl border border-red-900/40 bg-slate-900/50 p-6 text-center text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400 mr-2" />
          Could not reach the mainnet node. Retrying…
          <p className="mt-2 text-xs text-slate-600">
            Node: 66.94.106.193:8545 — check back in a moment.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-500">
        <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 mr-2 animate-pulse" />
        Loading live stats from the VeloxDAG mainnet…
        <p className="mt-2 text-xs text-slate-600">
          Fetching from the seed node at 66.94.106.193 — this takes 1–2 seconds.
        </p>
      </div>
    );
  }

  const mined = parseFloat(stats.totalMined.replace(",", ""));
  const max = 21_000_000;
  const pct = ((mined / max) * 100).toFixed(4);
  const supplyBarWidth = Math.min(parseFloat(pct), 100);

  const items = [
    { label: "Total mined", value: `${stats.totalMined} VELX` },
    { label: "Max supply", value: "21,000,000 VELX" },
    { label: "Remaining", value: `${stats.remainingSupply} VELX` },
    { label: "% mined", value: `${pct}%` },
    { label: "Block height", value: stats.blocks.toLocaleString() },
    { label: "Block reward", value: `${stats.blockReward} VELX` },
    { label: "Difficulty", value: stats.difficulty.toLocaleString() },
    { label: "Halving at", value: "210,000 blocks" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-center gap-2 text-sm">
        <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
        <span className={live ? "text-emerald-400 font-semibold" : "text-slate-500"}>
          {live ? "LIVE — Fair launch mainnet" : "Node offline — stats cached"}
        </span>
      </div>

      {/* supply progress bar */}
      <div className="mb-6 mx-auto max-w-2xl">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Mined: {pct}% of 21M VELX</span>
          <span>Remaining: {stats.remainingSupply}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500"
            style={{ width: `${supplyBarWidth}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 text-center"
          >
            <p className="text-base font-bold text-cyan-300 break-words leading-snug">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
