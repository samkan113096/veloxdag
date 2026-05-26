"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchBalance,
  fetchNonce,
  fetchStats,
  getRpcBase,
  setRpcBase,
  type BalanceResult,
  type NetworkStats,
} from "@/lib/rpc";

export default function WalletPage() {
  const [rpcUrl, setRpcUrl] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Send VELX state
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendFee, setSendFee] = useState("0.0001");
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sendLoading, setSendLoading] = useState(false);

  const rpcRef = useRef(rpcUrl);
  rpcRef.current = rpcUrl;

  useEffect(() => {
    setRpcUrl(getRpcBase());
  }, []);

  const effectiveBase = () => rpcUrl.trim() || getRpcBase();

  const lookup = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    const base = effectiveBase();
    setRpcBase(base);
    const addr = address.trim();
    if (!addr.startsWith("velx1")) {
      setError("Enter a valid velx1… address");
      setLoading(false);
      return;
    }
    const [bal, st] = await Promise.all([
      fetchBalance(addr, base),
      fetchStats(base),
    ]);
    if (!bal) {
      setError(
        "Could not reach the node. Check the RPC URL or point to a running veloxd instance."
      );
      setBalance(null);
    } else {
      setBalance(bal);
    }
    setStats(st);
    if (!silent) setLoading(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sendVELX = async () => {
    setSendLoading(true);
    setSendResult(null);
    const base = effectiveBase();
    const from = address.trim();
    const to = sendTo.trim();
    const amt = parseFloat(sendAmount);

    if (!from.startsWith("velx1") || !to.startsWith("velx1")) {
      setSendResult({ ok: false, msg: "Both addresses must start with velx1" });
      setSendLoading(false);
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setSendResult({ ok: false, msg: "Invalid amount" });
      setSendLoading(false);
      return;
    }

    const satoshi = Math.round(amt * 1e8);
    const feeSatoshi = Math.round(parseFloat(sendFee || "0.0001") * 1e8) || 10_000;

    // Fetch the current on-chain nonce for the sender
    const nonce = await fetchNonce(from, base);

    const tx = {
      from,
      to,
      amount: satoshi,
      fee: feeSatoshi,
      nonce,
      timestamp: Math.floor(Date.now() / 1000),
      signature: "unsigned", // full Ed25519 signing coming in next release
    };

    try {
      const url = base.replace(/\/$/, "");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "sendrawtransaction",
          params: tx,
          id: 1,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setSendResult({ ok: false, msg: data.error.message });
      } else {
        setSendResult({
          ok: true,
          msg: `✓ Submitted to mempool! TxID: ${data.result?.txid}`,
        });
        setSendAmount("");
        setSendTo("");
        // Refresh balance after short delay (next block might not be mined yet)
        setTimeout(() => lookup(true), 2000);
      }
    } catch (e: unknown) {
      setSendResult({
        ok: false,
        msg: e instanceof Error ? e.message : "Network error",
      });
    }
    setSendLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
        VELX Wallet
      </h1>
      <p className="mt-3 text-slate-400">
        Check your balance, receive VELX, and send it to any address on the VeloxDAG network.
      </p>

      {/* RPC + Address */}
      <div className="mt-8 space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <label className="block text-sm text-slate-400">
          Node RPC URL{" "}
          <span className="text-slate-600 text-xs">
            — leave blank to use the official public node
          </span>
          <input
            type="url"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            placeholder="https://your-node-url  (or leave blank)"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Your wallet address
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="velx1..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white font-mono"
            />
            {address.trim().startsWith("velx1") && (
              <button
                type="button"
                onClick={copyAddress}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:text-white"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
        </label>
        <button
          type="button"
          onClick={() => lookup(false)}
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Checking…" : "Check balance"}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {/* Balance display */}
      {balance && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <p className="text-sm text-emerald-300 uppercase tracking-widest">Your VELX Balance</p>
          <p className="mt-2 text-5xl font-extrabold text-white">{balance.formatted}</p>
          <p className="mt-1 text-xs text-emerald-400">VELX</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <p className="text-xs text-slate-500 font-mono break-all">{balance.address}</p>
            <button
              type="button"
              onClick={copyAddress}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              {copied ? "Copied!" : "copy"}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Share your address above to receive VELX from anyone.
          </p>
        </div>
      )}

      {/* Send VELX */}
      {balance && (
        <div className="mt-8 rounded-xl border border-violet-500/20 bg-slate-900/50 p-6">
          <h2 className="text-lg font-bold text-violet-300 mb-1">Send VELX</h2>
          <p className="text-xs text-slate-500 mb-4">
            Your transaction is broadcast to the network and confirmed in the next mined block (~60 s).
          </p>
          <div className="space-y-3">
            <label className="block text-sm text-slate-400">
              Recipient address (velx1…)
              <input
                type="text"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="velx1..."
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white font-mono"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm text-slate-400">
                Amount (VELX)
                <input
                  type="number"
                  min="0"
                  step="0.00000001"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="10.0"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-slate-400">
                Fee (VELX)
                <input
                  type="number"
                  min="0"
                  step="0.00000001"
                  value={sendFee}
                  onChange={(e) => setSendFee(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={sendVELX}
              disabled={sendLoading || !sendTo || !sendAmount}
              className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-cyan-600 py-3 font-semibold text-white disabled:opacity-40"
            >
              {sendLoading ? "Sending…" : "Send VELX"}
            </button>
            {sendResult && (
              <p
                className={`text-sm rounded-lg p-3 ${
                  sendResult.ok
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {sendResult.msg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Receive section */}
      {balance && (
        <div className="mt-6 rounded-xl border border-cyan-500/20 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold text-cyan-300 mb-2">Receive VELX</h2>
          <p className="text-sm text-slate-400 mb-3">
            Share your address with the sender. Any VELX sent to it will show up in your balance
            after the next block is confirmed.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3">
            <span className="flex-1 text-xs text-cyan-300 font-mono break-all">
              {balance.address}
            </span>
            <button
              type="button"
              onClick={copyAddress}
              className="text-xs rounded px-2 py-1 bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            >
              {copied ? "✓" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Network stats */}
      {stats && (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">Network stats (live)</h2>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            {(
              [
                ["Total mined", `${stats.totalMined} VELX`],
                ["Max supply", "21,000,000 VELX"],
                ["Remaining", `${stats.remainingSupply} VELX`],
                ["Mined %", `${stats.minedPercent}%`],
                ["Block height", stats.blocks.toLocaleString()],
                ["Block reward", `${stats.blockReward} VELX`],
                ["Difficulty", stats.difficulty.toLocaleString()],
              ] as [string, string][]
            ).map(([k, v]) => (
              <>
                <dt key={`dt-${k}`} className="text-slate-500">
                  {k}
                </dt>
                <dd key={`dd-${k}`} className="text-white font-mono text-xs">
                  {v}
                </dd>
              </>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-10 text-sm text-slate-500 space-y-1">
        <span className="block">
          Create a wallet CLI:{" "}
          <code className="text-cyan-400 bg-slate-900 px-1 rounded">./bin/velox-wallet new</code>
        </span>
        <span className="block">
          <a href="/tutorial" className="text-cyan-400 hover:underline">
            Mining tutorial →
          </a>
        </span>
      </div>
    </div>
  );
}
