"use client";

import { useEffect, useState } from "react";
import { fetchBalance, fetchNonce, fetchStats, getRpcBase, type NetworkStats } from "@/lib/rpc";

// ── crypto helpers (loaded lazily client-side only) ──────────────────────────
type KeyPair = { address: string; privateKeyHex: string; publicKeyHex: string };

async function mnemonicToKeypair(mnemonic: string, password: string): Promise<KeyPair> {
  const { mnemonicToEntropy } = await import("@scure/bip39");
  const { wordlist } = await import("@scure/bip39/wordlists/english.js");
  const { sha256, sha512 } = await import("@noble/hashes/sha2.js");
  const { getPublicKeyAsync } = await import("@noble/ed25519");

  // Derive seed: SHA256(entropy_hex + ":" + password)
  const entropy = mnemonicToEntropy(mnemonic.trim().toLowerCase(), wordlist);
  const entropyHex = Buffer.from(entropy).toString("hex");
  const seedBytes = sha256(new TextEncoder().encode(entropyHex + ":" + password));
  void sha512; // available if needed for HMAC
  const privKey = seedBytes;
  const pubKey = await getPublicKeyAsync(privKey);
  const addrHash = sha256(pubKey);
  const address = "velx1" + Buffer.from(addrHash.slice(0, 20)).toString("hex");
  return {
    address,
    privateKeyHex: Buffer.from(privKey).toString("hex"),
    publicKeyHex: Buffer.from(pubKey).toString("hex"),
  };
}

async function generateMnemonic(): Promise<string> {
  const { generateMnemonic: gen } = await import("@scure/bip39");
  const { wordlist } = await import("@scure/bip39/wordlists/english.js");
  return gen(wordlist, 128);
}

async function signTx(
  tx: Record<string, unknown>,
  privateKeyHex: string
): Promise<string> {
  const { signAsync } = await import("@noble/ed25519");
  const { sha256 } = await import("@noble/hashes/sha2.js");
  const msgBytes = new TextEncoder().encode(JSON.stringify(tx));
  const hash = sha256(msgBytes);
  const privKey = Uint8Array.from(Buffer.from(privateKeyHex, "hex"));
  const sig = await signAsync(hash, privKey);
  return Buffer.from(sig).toString("hex");
}

// ── encrypted wallet storage ─────────────────────────────────────────────────
async function encryptWallet(mnemonic: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(mnemonic));
  return JSON.stringify({
    salt: Array.from(salt), iv: Array.from(iv),
    ct: Array.from(new Uint8Array(ct)),
  });
}

async function decryptWallet(blob: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const { salt, iv, ct } = JSON.parse(blob);
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new Uint8Array(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) }, key, new Uint8Array(ct)
  );
  return new TextDecoder().decode(plain);
}

const STORAGE_KEY = "velox_wallet_v1";

function loadStoredWallets(): Record<string, { blob: string; address: string }> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch { return {}; }
}

function saveStoredWallet(label: string, blob: string, address: string) {
  const all = loadStoredWallets();
  all[label] = { blob, address };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// ── UI helpers ───────────────────────────────────────────────────────────────
const cls = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
const INPUT = "w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500";
const BTN_PRIMARY = "w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 py-3 font-semibold text-white disabled:opacity-40 transition-colors";
const BTN_GHOST = "rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-colors";

// ── Main component ────────────────────────────────────────────────────────────
export default function WalletPage() {
  type Tab = "access" | "create";
  const [tab, setTab] = useState<Tab>("access");

  // Session state (after unlock)
  const [keypair, setKeypair] = useState<KeyPair | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [stats, setStats] = useState<NetworkStats | null>(null);

  // Create wallet form
  const [newMnemonic, setNewMnemonic] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [newLabel, setNewLabel] = useState("My Wallet");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);

  // Access wallet form
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [savedWallets, setSavedWallets] = useState<Record<string, { blob: string; address: string }>>({});
  const [selectedLabel, setSelectedLabel] = useState("");
  const [accessMode, setAccessMode] = useState<"mnemonic" | "saved">("saved");
  const [accessMsg, setAccessMsg] = useState("");
  const [accessing, setAccessing] = useState(false);

  // Send form
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendFee, setSendFee] = useState("0.0001");
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sending, setSending] = useState(false);

  // Copy states
  const [copiedAddr, setCopiedAddr] = useState(false);

  useEffect(() => {
    const wallets = loadStoredWallets();
    setSavedWallets(wallets);
    const labels = Object.keys(wallets);
    if (labels.length) setSelectedLabel(labels[0]);
    else setAccessMode("mnemonic");
  }, []);

  const refreshBalance = async (addr: string) => {
    const base = getRpcBase();
    const [bal, st] = await Promise.all([fetchBalance(addr, base), fetchStats(base)]);
    setBalance(bal?.formatted ?? "0.00000000");
    setStats(st);
  };

  // ── Create wallet ────────────────────────────────────────────────────────
  const genMnemonic = async () => {
    const m = await generateMnemonic();
    setNewMnemonic(m);
    setShowMnemonic(true);
  };

  const createWallet = async () => {
    setCreating(true);
    setCreateMsg(null);
    try {
      if (!newMnemonic.trim()) { setCreateMsg({ ok: false, msg: "Generate or enter a seed phrase first." }); return; }
      if (newMnemonic.trim().split(/\s+/).length < 12) { setCreateMsg({ ok: false, msg: "Seed phrase must be 12 words." }); return; }
      if (!newPassword) { setCreateMsg({ ok: false, msg: "Password is required." }); return; }
      if (newPassword !== newPassword2) { setCreateMsg({ ok: false, msg: "Passwords do not match." }); return; }
      const kp = await mnemonicToKeypair(newMnemonic, newPassword);
      const blob = await encryptWallet(newMnemonic, newPassword);
      const label = newLabel.trim() || "My Wallet";
      saveStoredWallet(label, blob, kp.address);
      const updated = loadStoredWallets();
      setSavedWallets(updated);
      setSelectedLabel(label);
      setCreateMsg({ ok: true, msg: `Wallet created! Address: ${kp.address}` });
      // Auto-unlock
      setKeypair(kp);
      await refreshBalance(kp.address);
    } catch (e) {
      setCreateMsg({ ok: false, msg: e instanceof Error ? e.message : "Error creating wallet." });
    } finally {
      setCreating(false);
    }
  };

  // ── Access wallet ────────────────────────────────────────────────────────
  const accessWallet = async () => {
    setAccessing(true);
    setAccessMsg("");
    try {
      let kp: KeyPair;
      if (accessMode === "saved") {
        const w = savedWallets[selectedLabel];
        if (!w) throw new Error("Select a wallet.");
        if (!password) throw new Error("Enter your password.");
        const decrypted = await decryptWallet(w.blob, password);
        kp = await mnemonicToKeypair(decrypted, password);
      } else {
        if (!mnemonic.trim()) throw new Error("Enter your seed phrase.");
        if (!password) throw new Error("Enter your password.");
        kp = await mnemonicToKeypair(mnemonic, password);
      }
      setKeypair(kp);
      await refreshBalance(kp.address);
    } catch (e) {
      setAccessMsg(e instanceof Error ? e.message : "Could not access wallet. Check your seed phrase and password.");
    } finally {
      setAccessing(false);
    }
  };

  const lock = () => { setKeypair(null); setBalance(null); setStats(null); setPassword(""); setMnemonic(""); };
  const copyAddr = () => { navigator.clipboard.writeText(keypair?.address ?? ""); setCopiedAddr(true); setTimeout(() => setCopiedAddr(false), 1500); };

  // ── Send ─────────────────────────────────────────────────────────────────
  const sendVELX = async () => {
    if (!keypair) return;
    setSending(true);
    setSendResult(null);
    try {
      const to = sendTo.trim();
      const amt = parseFloat(sendAmount);
      if (!to.startsWith("velx1")) throw new Error("Recipient must start with velx1");
      if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");

      const base = getRpcBase();
      const nonce = await fetchNonce(keypair.address, base);
      const satoshi = Math.round(amt * 1e8);
      const feeSatoshi = Math.round(parseFloat(sendFee || "0.0001") * 1e8) || 10_000;
      const timestamp = Math.floor(Date.now() / 1000);

      const txPayload = { from: keypair.address, to, amount: satoshi, fee: feeSatoshi, nonce, timestamp };
      const signature = await signTx(txPayload, keypair.privateKeyHex);
      const tx = { ...txPayload, signature };

      const res = await fetch(base.replace(/\/$/, ""), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "sendrawtransaction", params: tx, id: 1 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      setSendResult({ ok: true, msg: `Sent! TxID: ${data.result?.txid}` });
      setSendAmount(""); setSendTo("");
      setTimeout(() => refreshBalance(keypair.address), 3000);
    } catch (e) {
      setSendResult({ ok: false, msg: e instanceof Error ? e.message : "Send failed" });
    } finally {
      setSending(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (keypair) return (
    <div className="mx-auto max-w-xl px-4 py-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">VELX Wallet</h1>
          <p className="text-sm text-slate-500 mt-1">VeloxDAG · Fair Launch</p>
        </div>
        <button onClick={lock} className={BTN_GHOST}>Lock wallet</button>
      </div>

      {/* Balance card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-5">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Balance</p>
        <p className="text-4xl font-extrabold text-white">{balance ?? "…"}</p>
        <p className="text-sm text-slate-400 mt-1">VELX</p>
        <div className="mt-4 flex items-center gap-2">
          <code className="text-xs text-cyan-400 bg-slate-950 px-2 py-1 rounded break-all flex-1">{keypair.address}</code>
          <button onClick={copyAddr} className={BTN_GHOST}>{copiedAddr ? "Copied!" : "Copy"}</button>
        </div>
        <button onClick={() => refreshBalance(keypair.address)} className="mt-3 text-xs text-slate-500 hover:text-slate-300 underline">Refresh balance</button>
      </div>

      {/* Receive */}
      <div className="rounded-xl border border-cyan-900/40 bg-slate-900/40 p-5 mb-5">
        <h2 className="text-base font-semibold text-cyan-300 mb-2">Receive VELX</h2>
        <p className="text-sm text-slate-400 mb-3">Share your address — anyone can send VELX to it.</p>
        <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
          <span className="text-xs text-cyan-300 font-mono break-all flex-1">{keypair.address}</span>
          <button onClick={copyAddr} className="text-xs px-2 py-1 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:text-white">{copiedAddr ? "✓" : "Copy"}</button>
        </div>
      </div>

      {/* Send */}
      <div className="rounded-xl border border-violet-900/40 bg-slate-900/40 p-5 mb-5">
        <h2 className="text-base font-semibold text-violet-300 mb-3">Send VELX</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Recipient address</label>
            <input className={INPUT} value={sendTo} onChange={e => setSendTo(e.target.value)} placeholder="velx1..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Amount (VELX)</label>
              <input className={INPUT} type="number" min="0" step="0.00000001" value={sendAmount} onChange={e => setSendAmount(e.target.value)} placeholder="10.0" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fee (VELX)</label>
              <input className={INPUT} type="number" min="0" step="0.00000001" value={sendFee} onChange={e => setSendFee(e.target.value)} />
            </div>
          </div>
          <button className={BTN_PRIMARY} onClick={sendVELX} disabled={sending || !sendTo || !sendAmount}>
            {sending ? "Signing & sending…" : "Send VELX"}
          </button>
          {sendResult && (
            <p className={cls("text-sm rounded-lg p-3", sendResult.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
              {sendResult.msg}
            </p>
          )}
        </div>
      </div>

      {/* Network stats */}
      {stats && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
          <h2 className="text-sm font-semibold text-slate-400 mb-3">Network</h2>
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            {([
              ["Blocks", stats.blocks.toLocaleString()],
              ["Mined", `${stats.totalMined} VELX`],
              ["Remaining", `${stats.remainingSupply} VELX`],
              ["Mined %", `${stats.minedPercent}%`],
              ["Reward", `${stats.blockReward} VELX`],
              ["Difficulty", Number(stats.difficulty).toLocaleString()],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="contents">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-300 font-mono">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <h1 className="text-3xl font-bold text-white mb-1">VELX Wallet</h1>
      <p className="text-slate-400 mb-8 text-sm">Your keys, your coins — all cryptography runs in your browser.</p>

      {/* Tab switcher */}
      <div className="flex rounded-lg border border-slate-800 overflow-hidden mb-6 text-sm font-medium">
        {(["access", "create"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cls("flex-1 py-2.5 transition-colors",
              tab === t ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
            )}>
            {t === "access" ? "Access wallet" : "Create wallet"}
          </button>
        ))}
      </div>

      {/* ── Access tab ── */}
      {tab === "access" && (
        <div className="space-y-4">
          {Object.keys(savedWallets).length > 0 && (
            <div className="flex rounded-lg border border-slate-800 overflow-hidden text-xs font-medium mb-2">
              {(["saved", "mnemonic"] as const).map(m => (
                <button key={m} onClick={() => setAccessMode(m)}
                  className={cls("flex-1 py-2 transition-colors",
                    accessMode === m ? "bg-slate-800 text-white" : "text-slate-500 hover:text-white"
                  )}>
                  {m === "saved" ? "Saved wallets" : "Enter seed phrase"}
                </button>
              ))}
            </div>
          )}

          {accessMode === "saved" && Object.keys(savedWallets).length > 0 ? (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Select wallet</label>
              <select className={INPUT} value={selectedLabel} onChange={e => setSelectedLabel(e.target.value)}>
                {Object.entries(savedWallets).map(([label, w]) => (
                  <option key={label} value={label}>{label} — {w.address.slice(0, 16)}…</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Seed phrase (12 words)</label>
              <textarea className={cls(INPUT, "h-20 resize-none")} value={mnemonic}
                onChange={e => setMnemonic(e.target.value)}
                placeholder="word1 word2 word3 … word12" />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input className={INPUT} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your wallet password"
              onKeyDown={e => e.key === "Enter" && accessWallet()} />
          </div>

          <button className={BTN_PRIMARY} onClick={accessWallet} disabled={accessing}>
            {accessing ? "Unlocking…" : "Unlock wallet"}
          </button>
          {accessMsg && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">{accessMsg}</p>}

          <p className="text-xs text-slate-600 text-center pt-2">
            No account required. Your seed phrase never leaves your device.
          </p>
        </div>
      )}

      {/* ── Create tab ── */}
      {tab === "create" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Wallet name</label>
            <input className={INPUT} value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="My Wallet" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-400">Seed phrase (12 words)</label>
              <button onClick={genMnemonic} className="text-xs text-cyan-400 hover:text-cyan-300 underline">Generate</button>
            </div>
            {newMnemonic ? (
              <div className="relative">
                <div className={cls(
                  "rounded-lg border border-slate-700 bg-slate-950 p-4",
                  !showMnemonic && "blur-sm select-none"
                )}>
                  <div className="grid grid-cols-3 gap-2">
                    {newMnemonic.split(" ").map((w, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 w-4 text-right">{i + 1}.</span>
                        <span className="text-sm text-cyan-300 font-mono">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {!showMnemonic && (
                  <button onClick={() => setShowMnemonic(true)}
                    className="absolute inset-0 w-full rounded-lg text-sm text-slate-300 hover:text-white">
                    Click to reveal
                  </button>
                )}
              </div>
            ) : (
              <textarea className={cls(INPUT, "h-20 resize-none")} value={newMnemonic}
                onChange={e => setNewMnemonic(e.target.value)}
                placeholder="Click Generate above, or type your own 12-word phrase" />
            )}
            {newMnemonic && (
              <p className="text-xs text-amber-400 mt-2">
                ⚠ Write these 12 words down and store them safely. Anyone with them can access your funds.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input className={INPUT} type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} placeholder="Choose a strong password" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Confirm password</label>
            <input className={INPUT} type="password" value={newPassword2}
              onChange={e => setNewPassword2(e.target.value)} placeholder="Repeat password" />
          </div>

          <button className={BTN_PRIMARY} onClick={createWallet} disabled={creating || !newMnemonic}>
            {creating ? "Creating wallet…" : "Create wallet"}
          </button>

          {createMsg && (
            <p className={cls("text-sm rounded-lg p-3", createMsg.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
              {createMsg.msg}
            </p>
          )}

          <p className="text-xs text-slate-600 text-center pt-2">
            Your wallet is encrypted with AES-256-GCM and stored locally. Your seed phrase never leaves your browser.
          </p>
        </div>
      )}
    </div>
  );
}
