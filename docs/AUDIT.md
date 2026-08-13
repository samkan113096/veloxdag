# VeloxDAG Quick Audit Report

**Date:** 2026-08-12 (updated)  
**Scope:** Chain (`chain/`), Website (`website/`), Docs (`docs/`)  
**Auditor:** Automated review + unit/integration tests

---

## Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Go build | ✅ PASS | `veloxd`, `velox-miner`, `velox-wallet` compile clean |
| Go vet | ✅ PASS | No issues |
| Unit tests | ✅ PASS | 13 tests — genesis, mining, persistence, PoW/sig/height/timestamp/mint/overdraw/cap |
| Website build | ✅ PASS | 34 static pages generated |
| Fair launch | ✅ VERIFIED | Genesis supply = 0, no coinbase at genesis |
| Signature interop | ✅ VERIFIED | `@noble/ed25519` browser sigs verify with Go `crypto/ed25519` |
| End-to-end | ✅ VERIFIED | `verify-local.sh` mines a block and persists balance |
| Blog posts | ✅ 20/20 | All slugs generate static pages |
| Social calendar | ✅ 90/90 | Twitter + Telegram |
| Litepaper | ✅ 22 sections | Synced with shipped code |
| Email templates | ✅ 9 templates | |

---

## Security Hardening — 2026-08-12

The following consensus-critical vulnerabilities were fixed before launch. **These changes alter consensus rules, so any existing `chain.json` state must be deleted (re-genesis) before the network goes live.**

### Fixed

1. **Unbounded mint via empty sender (`CRITICAL`)** — `SubmitBlock` credited `tx.To` even when `tx.From` was empty, letting any miner mint arbitrary VELX and break the 21M cap. **Fixed:** every transaction requires a valid, signature-bound sender; empty-sender txs are rejected in both the mempool and blocks.

2. **No transaction signature verification (`CRITICAL`)** — the `Signature` field existed but was never checked, so anyone could spend any address via `sendrawtransaction`. **Fixed:** `crypto.VerifyTx` verifies (a) sender/recipient addresses are well-formed, (b) the embedded `PublicKey` hashes to the sender address, and (c) the Ed25519 signature verifies over the canonical signing message. Enforced in both `AddTx` and `SubmitBlock`.

3. **Unvalidated block height (`HIGH`)** — a block could claim any `height`, bypassing the halving/emission schedule. **Fixed:** height must equal the maximum parent height + 1.

4. **Unvalidated block timestamp (`HIGH`)** — miner-controlled timestamps could game difficulty retargeting. **Fixed:** block timestamps must be ≥ the newest parent and ≤ now + 2h.

5. **Invalid txs silently dropped (`MEDIUM`)** — `SubmitBlock` skipped insufficient-balance txs with `continue` instead of rejecting the block. **Fixed:** any invalid transaction rejects the entire block.

6. **Mempool aggregate overdraw (`MEDIUM`)** — a sender could queue multiple txs that each passed the balance check individually but overdraw in aggregate, poisoning every block template. **Fixed:** `AddTx` debits pending mempool txs from the same sender before validating the next.

7. **Unbounded block size (`MEDIUM`)** — a miner could stuff arbitrary txs into a block. **Fixed:** `MaxTxsPerBlock = 100` enforced in `SubmitBlock`.

8. **P2P sync delivered blocks out of order (`HIGH`)** — `GetBlocksFromHeight` iterated a Go map (random order), so a syncing peer received children before parents and rejected them, breaking new-node sync. **Fixed:** blocks are now served in ascending height order; the periodic sync loop re-requests from all peers so missed gossip is recovered.

9. **Public RPC proxy exposed mining/peer methods (`HIGH`)** — the Netlify function forwarded every RPC method, including `submitblock`/`getblocktemplate`/`addpeer`. **Fixed:** an allowlist now permits only read methods + `sendrawtransaction`.

### Deployment note

Consensus changes require a fresh genesis. On the VPS node (and any local node), run:

```bash
rm -f ~/.veloxdag/chain.json   # then restart the node
```

---

## Chain Security Findings

### Fixed during this audit ✅

1. **PoW hash/header mismatch** — `submitblock` previously only checked difficulty on `block.Hash` without verifying hash matched header fields. **Fixed:** `pow.VerifyBlock()` recomputes hash from header + nonce before acceptance.

2. **Genesis hash fallback** — Invalid PoW could fall back to JSON `ComputeHash()`, creating inconsistent hash scheme. **Fixed:** Genesis init fails if PoW mining fails.

3. **Mutex deadlock** — `InitGenesis()` called `Save()` while holding write lock. **Fixed:** Uses `saveLocked()` (fixed in prior session).

4. **Race on RPC info** — `handleInfo` read `State.Difficulty` without lock. **Fixed:** `GetChainInfo()` with RWMutex.

5. **Transaction nonce** — Mempool accepted any nonce. **Fixed:** Must match on-chain nonce.

### Open items (known limitations — not blockers for devnet) ⚠️

| ID | Severity | Issue | Recommendation |
|----|----------|-------|----------------|
| A1 | ~~High~~ Fixed | ~~No P2P networking~~ | Added `pkg/p2p` gossip layer (port 37373) |
| A2 | **Medium** | RPC has no authentication (binds `127.0.0.1` by default; `-lan` opens `0.0.0.0`) | Add API key for public nodes; Netlify proxy now method-allowlisted |
| A3 | ~~High~~ Fixed | ~~Transactions not cryptographically verified~~ | `crypto.VerifyTx` enforces Ed25519 signatures in `AddTx` + `SubmitBlock` |
| A4 | **Medium** | Mempool not persisted (`json:"-"`) | Persist mempool or document restart behavior |
| A5 | ~~Medium~~ Fixed | ~~Low initial difficulty~~ | Initial difficulty is 50,000,000 (calibrated for ~60s CPU blocks) |
| A6 | ~~Medium~~ Fixed | ~~No block size / weight limits~~ | `MaxTxsPerBlock = 100` enforced in `SubmitBlock` |
| A7 | **Medium** | DAG ordering simplified — no full GHOST consensus | Document as v1; plan proper ordering for production |
| A8 | **Low** | `chain.json` world-readable (0644) | Use 0600 for wallet/chain data |
| A9 | **Low** | No rate limiting on RPC | Add per-IP limits on public endpoints |
| A10 | **Info** | Miner goroutines run infinite loop with 1B nonce window | Works; may miss nonces at high difficulty — reset logic exists |

---

## Fair Launch Verification

```
Genesis block:
  - Coinbase reward applied: NO (TotalSupply = 0 at genesis)
  - Premine allocation: NONE
  - First VELX minted: block height 1+ coinbase (50 VELX)
```

Confirmed by `TestGenesisFairLaunch` and `getchaininfo` returning `"fairLaunch": true`.

---

## Website / SEO Verification

| Check | Result |
|-------|--------|
| `sitemap.xml` | ✅ Generated |
| `robots.txt` | ✅ Allow all + sitemap URL |
| Meta tags / OG | ✅ In root layout |
| Pages | ✅ /, /about, /tutorial, /contact, /blog, /team, /litepaper |
| Blog SSG | ✅ 20 posts pre-rendered |
| Litepaper download | ✅ `/VELOXDAG-LITEPAPER.md` in public/ |
| Manifest | ✅ `public/manifest.json` |

---

## Marketing Content Verification

| Asset | Count | Path |
|-------|-------|------|
| Twitter posts | 90 | `docs/marketing/twitter-90-days.md` |
| Telegram posts | 90 | `docs/marketing/telegram-90-days.md` |
| Email templates | 9 | `docs/marketing/email-templates.md` |

---

## Team Section

Sam Kan (Lead Protocol & Security Engineer) is listed on the site team page and in the litepaper. No personal website, GitHub, or email links are published, matching the privacy-first presentation.

---

## How to Re-run Verification

```bash
# Unit tests
cd chain && go test ./... -v

# Build all
cd chain && go build ./...
cd website && npm run build

# Integration smoke test
./scripts/smoke-test.sh
```

---

## Conclusion

**VeloxDAG is internally consistent and functional for local devnet mining and marketing launch prep.** All automated tests pass. Critical PoW validation bugs found during audit have been fixed.

**Do not treat this as a production mainnet audit.** Before public launch with real value: add P2P sync, signature verification, third-party security audit, and legal review.

---

*This document is a quick internal audit, not a formal smart contract or protocol audit.*
