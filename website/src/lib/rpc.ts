export type NetworkStats = {
  status: string;
  blocks: number;
  totalMined: string;
  totalSupply: string;
  maxSupply: string;
  remainingSupply: string;
  minedPercent: string;
  blockReward: string;
  difficulty: number;
  tipCount: number;
  fairLaunch: boolean;
  premine: string;
};

export type BalanceResult = {
  address: string;
  balance: number;
  formatted: string;
};

const DEFAULT_RPC =
  process.env.NEXT_PUBLIC_VELOX_RPC_URL || "/.netlify/functions/velox-rpc";

export function getRpcBase(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("velox_rpc_url") || DEFAULT_RPC;
  }
  return DEFAULT_RPC;
}

export function setRpcBase(url: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("velox_rpc_url", url);
  }
}

export async function fetchStats(rpcBase?: string): Promise<NetworkStats | null> {
  const base = rpcBase || getRpcBase();
  try {
    const url = base.includes("netlify/functions")
      ? `${base}?path=stats`
      : `${base.replace(/\/$/, "")}/api/stats`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchBalance(
  address: string,
  rpcBase?: string
): Promise<BalanceResult | null> {
  const base = rpcBase || getRpcBase();
  try {
    if (base.includes("netlify/functions")) {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "getbalance",
          params: { address },
          id: 1,
        }),
      });
      const data = await res.json();
      return data.result ?? null;
    }
    const res = await fetch(base.replace(/\/$/, ""), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getbalance",
        params: { address },
        id: 1,
      }),
    });
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}
