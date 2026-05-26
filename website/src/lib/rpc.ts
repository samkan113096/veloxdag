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
    if (!url || url === DEFAULT_RPC) {
      localStorage.removeItem("velox_rpc_url");
    } else {
      localStorage.setItem("velox_rpc_url", url);
    }
  }
}

function isNetlifyProxy(base: string) {
  return base.includes("netlify/functions") || base.startsWith("/.");
}

/** POST a JSON-RPC call. Works whether pointed at the Netlify proxy or a raw node. */
async function rpcCall(
  method: string,
  params: Record<string, unknown>,
  base: string
): Promise<unknown> {
  const url = isNetlifyProxy(base)
    ? base.replace(/\/$/, "")
    : base.replace(/\/$/, "");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

export async function fetchStats(rpcBase?: string): Promise<NetworkStats | null> {
  const base = rpcBase || getRpcBase();
  try {
    let url: string;
    if (isNetlifyProxy(base)) {
      url = `${base.replace(/\/$/, "")}?path=stats`;
    } else {
      url = `${base.replace(/\/$/, "")}/api/stats`;
    }
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
    const result = await rpcCall("getbalance", { address }, base);
    return result as BalanceResult;
  } catch {
    return null;
  }
}

export async function fetchNonce(
  address: string,
  rpcBase?: string
): Promise<number> {
  const base = rpcBase || getRpcBase();
  try {
    const result = (await rpcCall("getnonce", { address }, base)) as {
      nonce: number;
    };
    return result.nonce ?? 0;
  } catch {
    return 0;
  }
}
