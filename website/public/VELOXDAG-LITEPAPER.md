# VeloxDAG (VELX) Litepaper

**Version 1.0 · May 2026**

**The Fastest Fair-Launch Proof-of-Work BlockDAG**

---

| Parameter | Value |
|-----------|-------|
| **Ticker** | VELX |
| **Consensus** | Proof-of-Work (SHA-256 double hash) |
| **Architecture** | BlockDAG (up to 2 parents per block) |
| **Block Reward** | 50 VELX (initial, fixed at launch) |
| **Premine** | 0% |
| **ICO / VC** | None |
| **Launch Mining** | CPU-friendly at genesis |
| **Target Block Interval** | ~10 seconds |
| **Decimals** | 8 |
| **Website** | [https://veloxdag.com](https://veloxdag.com) |
| **Repository** | [https://github.com/veloxdag](https://github.com/veloxdag) |

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Problem Statement](#3-problem-statement)
4. [VeloxDAG Vision & Design Principles](#4-veloxdag-vision--design-principles)
5. [BlockDAG Architecture](#5-blockdag-architecture)
6. [Proof-of-Work Consensus](#6-proof-of-work-consensus)
7. [Fair Launch Tokenomics](#7-fair-launch-tokenomics)
8. [Emission Schedule & Monetary Policy](#8-emission-schedule--monetary-policy)
9. [Security Model](#9-security-model)
10. [Attack Vectors & Mitigations](#10-attack-vectors--mitigations)
11. [Technical Specifications](#11-technical-specifications)
12. [Node Software Stack](#12-node-software-stack)
13. [RPC API Reference](#13-rpc-api-reference)
14. [Mining Guide Summary](#14-mining-guide-summary)
15. [Comparison: Bitcoin, Kaspa, BlockDAG, and VeloxDAG](#15-comparison-bitcoin-kaspa-blockdag-and-veloxdag)
16. [Ecosystem & Developer Roadmap](#16-ecosystem--developer-roadmap)
17. [Governance](#17-governance)
18. [Community & Participation](#18-community--participation)
19. [Team](#19-team)
20. [Legal Disclaimer & Risk Factors](#20-legal-disclaimer--risk-factors)
21. [Roadmap](#21-roadmap)
22. [Conclusion](#22-conclusion)

---

## 1. Abstract

VeloxDAG is a fair-launch, Proof-of-Work BlockDAG blockchain that issues its native asset **VELX** exclusively through mining. There is no premine, no initial coin offering, no venture capital allocation, and no genesis insider distribution. The network combines the throughput advantages of directed acyclic graph (DAG) block structures with the credibility and permissionless participation model that made early Bitcoin and modern Kaspa communities so durable.

At launch, VeloxDAG pays **50 VELX** per successfully mined block to the miner address embedded in the block header. Consensus security is anchored in **double SHA-256** proof-of-work—the same family of hash functions used by Bitcoin—adapted for parallel block production in a BlockDAG. Blocks may reference up to **two parents**, enabling multiple miners to extend the ledger simultaneously rather than competing for a single linear chain tip.

VeloxDAG targets approximately **ten-second** block intervals and is engineered for **CPU mining at launch**, lowering the barrier to entry for solo miners, hobbyists, and geographically distributed participants who were priced out of ASIC-dominated networks. The project is open source, with reference implementations for a full node (`veloxd`), miner (`velox-miner`), and wallet (`velox-wallet`).

This litepaper presents the economic thesis, architectural rationale, security assumptions, technical parameters, and community roadmap for VeloxDAG. It is intended for miners, developers, researchers, and participants evaluating whether to run infrastructure, build applications, or hold VELX as a purely earned asset. VeloxDAG does not promise returns; it promises **rules**—transparent, verifiable, and aligned with miners from block one.

Readers should treat this document as the companion to the open-source repository: claims about premine, rewards, and algorithms are verifiable by inspecting `chain/pkg/types`, `chain/pkg/pow`, and `chain/pkg/chain`. The abstract goal is not to maximize hype but to minimize **information asymmetry**—the same asymmetry that fair launch eliminates in token distribution. VeloxDAG competes on credibility first and throughput second, because without credibility, throughput is merely a faster rug vector.

In a market saturated with “next Kaspa” marketing, VeloxDAG’s restraint is its signal: one block reward (50 VELX), one hash function family (SHA-256), one issuance path (mining), and one graph shape (BlockDAG). Everything else—pools, exchanges, contracts, bridges—is optional infrastructure that the community may or may not build. The protocol’s job is to remain boring, predictable, and expensive to attack. The community’s job is to make that boring protocol useful.

---

## 2. Introduction

Cryptocurrency was born as a rebellion against trusted third parties. Satoshi Nakamoto’s Bitcoin demonstrated that a global ledger could be secured by economic incentives and proof-of-work rather than by banks or governments. Over fifteen years, that idea forked into thousands of experiments—some brilliant, many extractive. The industry’s center of gravity shifted from “anyone can mine” to “anyone can buy after insiders vest.” Unlock schedules, private sales, and opaque treasury multisigs became the default; fair launch became a nostalgic talking point.

Meanwhile, **BlockDAG** research and production networks—notably Kaspa—proved that Proof-of-Work is not inherently slow. By allowing blocks to reference multiple predecessors, a DAG-shaped ledger absorbs parallel work instead of forcing the network into a single-block bottleneck. Throughput rises. Confirmation latency falls. Users experience a chain that *feels* modern without abandoning decentralization’s hardest requirement: permissionless participation.

**VeloxDAG** enters this landscape with a deliberate constraint: **every VELX token must be mined into existence.** We do not ask the market to trust a whitepaper allocation table. We ask it to verify consensus code. Genesis carries zero spendable premine. The first economically meaningful VELX appears in the coinbase of post-genesis blocks, paid to whoever finds valid proof-of-work first.

VeloxDAG is built for three overlapping audiences. **Miners** receive a credibly neutral issuance schedule and CPU-viable economics at launch. **Developers** receive a JSON-RPC interface, clear block templates, and a roadmap toward WASM smart contracts. **Users** receive a payment-oriented L1 narrative: fast PoW confirmations without the baggage of VC-captured supply.

The name *Velox*—Latin for swift—signals intent. Speed in a BlockDAG is not cosmetic; it is user experience, fee markets, and the difference between a network used for settlement versus one used for speculation only. DAG is not a marketing suffix here; it is the data structure that defines how blocks connect, how tips evolve, and how difficulty retargets in response to parallel mining.

This document is the canonical technical and economic overview of VeloxDAG at launch. It will evolve with mainnet telemetry, governance decisions, and community proposals—but the **fair launch invariant** will not.

Historically, the most loyal communities formed around networks where early participants could not be tricked by cap tables. Bitcoin’s early miners did not need to read a vesting schedule. Kaspa’s grassroots hashers understood they were competing on work, not on who attended a seed round. VeloxDAG consciously revives that cultural contract while adopting architecture appropriate for modern payment latency expectations. We are not anti-institution; we are anti-hidden-allocation. Funds, market makers, and miners are welcome—after emission begins, on equal terms.

From a systems perspective, VeloxDAG is also a bet on **operational openness**: binaries you can build yourself, RPC you can curl, and blocks you can inspect in JSON. That openness is how decentralized networks scale socially even when they are young technologically. If you are reading this because a influencer promised 100×, pause: this paper is about mechanism design. If you are reading because you want to run a miner on hardware you already own, welcome—you are the intended audience.

---

## 3. Problem Statement

The cryptocurrency market faces a converging set of failures that VeloxDAG is designed to address directly.

**Extractive tokenomics.** A large fraction of new L1 and L2 tokens allocate double-digit percentages to teams, investors, and advisors at genesis or via cliffs that retail participants cannot diligence in real time. Even when disclosures exist, the *game* is asymmetric: insiders optimize for liquidity events; miners and users optimize for utility. VeloxDAG removes the insider lane entirely—**0% premine, 0% ICO, 0% VC**—so that the only way to obtain VELX at the protocol level is to perform work (mining) or acquire coins from someone who did.

**Linear chain bottlenecks.** Traditional blockchains organize blocks in a single sequence. Only one block “wins” per interval; orphaned work is wasted. Under load, mempools congest, fees spike, and small payments become uneconomical. BlockDAG architectures reduce structural waste by accepting multiple compatible blocks per wave front, increasing effective throughput without requiring a trusted sequencer.

**Mining centralization.** Bitcoin’s success also centralized hash power into industrial farms and ASIC supply chains. Many newer “Proof-of-Work” projects launch directly into ASIC-friendly parameters, effectively excluding retail miners from day one. VeloxDAG launches with **CPU-minable** difficulty parameters and commits to community-governed adjustments that preserve a meaningful solo-mining window before industrialization (if ever) occurs organically.

**Narrative without neutrality.** The BlockDAG category exploded in mindshare, but not every project coupled architectural innovation with issuance neutrality. Some carried legacy allocations, opaque foundations, or corporate wrappers. VeloxDAG aims to be the **fair-launch expression** of the BlockDAG thesis: the same architectural family as Kaspa-inspired networks, without the cap table.

**Developer distrust.** Builders hesitate to deploy value on chains whose monetary policy can be changed by a small multisig or whose validators are unreplicated venture portfolios. VeloxDAG’s initial trust anchor is **open source code** and **transparent emission**—not brand partnerships.

VeloxDAG does not claim to solve every problem in Web3. It does not promise infinite scalability, private transactions at launch, or instant finality in the BFT sense. It promises a **credible base layer** where security is purchased with hash power, issuance is visible on-chain, and participation requires nothing more than software and electricity.

The problem statement is not merely ideological. Extractive launches create **adverse selection**: mercenary capital enters first, exits on retail liquidity, and leaves anemic communities. Fair launch does the opposite—it filters for participants willing to incur mining costs or pay miners fair market prices. That filter is noisy but honest. Similarly, linear-chain latency is not an abstract inconvenience; it is why merchants disable crypto checkout during congestion. BlockDAG does not magically eliminate congestion, but it changes the geometry of block production so honest parallel work is less often discarded.

Finally, there is a **category risk**: when every project claims “BlockDAG,” users cannot distinguish architecture from branding. VeloxDAG addresses category risk with **auditable parameters** and **reference code**, not with louder adjectives. The problem we solve is trust in issuance and clarity in design—speed follows from DAG mechanics, but neutrality is the reason the project exists.

---

## 4. VeloxDAG Vision & Design Principles

VeloxDAG’s vision is to become the **reference fair-launch BlockDAG** for miners and developers who believe speed and neutrality should coexist—not trade off.

Our design principles are non-negotiable:

**Fair launch first.** No protocol-level advantage for founders at genesis. Core contributors mine like everyone else. Transparency is enforced by code, not press releases.

**Proof-of-Work security.** PoW ties security to real-world cost. VeloxDAG uses battle-tested SHA-256 double hashing. We do not substitute stake-weighted committees at the base layer.

**DAG-native throughput.** Blocks reference up to two parents. Tips represent the DAG frontier. Miners extend the graph, not a single lottery ticket.

**Permissionless participation.** Run a node. Mine solo. Query RPC. No allowlists at launch.

**Simplicity before complexity.** The launch client focuses on consensus, mining, transfers, and mempool semantics. Smart contracts, cross-chain bridges, and L2 systems follow on roadmap milestones with audit discipline.

**Community-upgradable monetary policy.** Fixed 50 VELX block rewards at launch provide predictability. Long-term halving or fee-market emphasis may be proposed through governance once the network has operational history.

**Security as engineering culture.** External review, responsible disclosure, fuzz testing, and static analysis are part of the culture—not a pre-mainnet checkbox.

VeloxDAG is intentionally **opinionated**: we believe the next wave of credible L1 growth looks more like **earned distribution** and **parallel PoW** than like **allocated supply** and **single-chain queues**. If that resonates, the network is yours to hash on.

Design principles interact: fair launch without PoW would invite sybil issuance; PoW without DAG would leave performance on the table; DAG without sane tip policies would confuse wallets; wallets without RPC would block integrations. VeloxDAG sequences these dependencies deliberately—consensus and mining first, contracts later. That sequencing is itself a principle: **do not ship complexity before security budget exists.**

We also reject “move fast and break holders” culture. Breaking consensus is acceptable only with wide miner notice and reproducible migrations. Breaking key material is never acceptable. The vision is therefore conservative in governance process even when marketing is ambitious in category positioning.

Long-term, success is measured by **credible neutrality** plus **daily usability**. Neutrality without usability yields academic chains; usability without neutrality yields extractive chains. VeloxDAG pursues both by keeping launch rules minimal and community upgrade paths explicit. We want miners in Lagos, São Paulo, and Seoul to run nodes—not only datacenters in a single jurisdiction. We want developers in universities to reproduce attacks in testnets—not only auditors in private Slack channels. The vision scales socially before it scales technically.

---

## 5. BlockDAG Architecture

A blockchain, strictly speaking, is a chain: each block has one parent (except genesis). A **BlockDAG** generalizes this: each block may have **multiple parents**, forming a directed acyclic graph of confirmed blocks. VeloxDAG constrains each block to reference **at most two parents** (`MaxParents = 2`), balancing expressiveness with implementation clarity.

### 5.1 Why a DAG?

In a linear chain, two miners who find blocks at the same height force a fork; one branch becomes stale. In a DAG, both blocks may remain **compatible** if they reference consistent history and pass consensus rules. Parallelism increases **effective block rate** and reduces the percent of hash power wasted on orphans—especially when target intervals are short (~10 seconds).

### 5.2 Tips and the DAG Frontier

The **tips** of the DAG are blocks with no children yet— the “frontier” where new blocks attach. When a miner builds a template, they select parents from current tips (VeloxDAG’s reference implementation chooses up to two recent tips). Upon accepting a new block, the node **updates tips**: the new block becomes a tip, and any parent of the new block is removed from the tip set if it is now referenced.

To bound memory, the implementation caps the tip set size (e.g., retaining at most ten tips under burst conditions). This is a pragmatic engineering choice for early mainnet; future versions may adopt more sophisticated tip-selection policies inspired by GHOSTDAG or PHANTOM family protocols.

### 5.3 Ordering and Confirmation

VeloxDAG’s launch client uses a **heaviest-work / cumulative difficulty** intuition at the template layer: miners extend known valid blocks, and nodes reject submissions with unknown parents or invalid proof-of-work. As the ecosystem matures, explicit **DAG ordering** for transaction finality—selecting a main ordering from the graph—can be hardened in consensus rules. At launch, user-facing confirmation is **probabilistic**: depth in the DAG and growth of descendant work, similar in spirit to early Nakamoto confirmations but with multiple parallel branches contributing to perceived speed.

### 5.4 Merkle Roots and Transactions

Each block header includes a **Merkle root** over its transaction list. Blocks may include transfers from the mempool; miners collect fees in addition to the coinbase. Empty blocks are valid—useful for soak-testing mining infrastructure.

### 5.5 Throughput Narrative

VeloxDAG does not claim unbounded TPS on day one. It claims **structural parallelism**: the network is not forced to wait for a single 10-minute slot. With ~10-second targets and two-parent references, aggregate inclusion capacity scales with **honest hash participation** and efficient block propagation—subject to bandwidth and validation costs on full nodes.

The BlockDAG is not a sidecar feature. It is the **primary ledger shape** of VeloxDAG—everything else (wallets, explorers, pools) indexes that graph.

### 5.6 Comparison to Linear “Fast Chains”

Some networks achieve low latency by reducing validator sets or relying on leader rotation with stake-weighted committees. VeloxDAG does not trade validator count for speed at the base layer; it absorbs parallel blocks. That distinction matters for marketing and for security audits: our throughput story is tied to **work**, not to **permissioned quorum size**.

### 5.7 Wallet and UX Implications

Wallets should display **confirmations** as growing work behind a transaction’s containing block within the DAG, not merely as “6 blocks” divorced from graph context. UX teams should educate users that seeing multiple tips is normal—not a sign of network failure. Explorers should visualize parent links to demystify DAG structure for newcomers.

### 5.8 Research Trajectory

Academic BlockDAG literature (PHANTOM, GHOSTDAG, inclusive protocols) informs our long-term roadmap. Launch pragmatism may simplify ordering rules; research rigor will harden them. VeloxDAG welcomes collaboration with universities and independent researchers—especially on formalizing reorg bounds in multi-parent settings.

---

## 6. Proof-of-Work Consensus

VeloxDAG secures its ledger with **Proof-of-Work**. Miners search for a nonce such that the block hash, interpreted as a big-endian integer, is **less than or equal to** a difficulty target derived from the network’s current difficulty parameter.

### 6.1 Hash Function

The mining puzzle uses **double SHA-256**:

1. Serialize a canonical **header prefix** from version, parents, timestamp, difficulty, Merkle root, miner address, height, and extra data.
2. Append an 8-byte big-endian **nonce**.
3. Compute `SHA256(SHA256(prefix || nonce))`.
4. Compare the result against `target = 2^256 / difficulty` (with difficulty floored at 1).

This aligns VeloxDAG with the same cryptographic primitive family as Bitcoin, benefiting from extensive hardware and software ecosystems, well-understood attack surfaces, and optimizer libraries on CPUs.

### 6.2 Difficulty Adjustment

The reference node retargets on intervals of **30 blocks** (`RetargetInterval`). The launch heuristic examines **DAG tip count**:

- If tips **exceed three**, difficulty **increases** (network is producing parallel blocks quickly).
- If tips **equal one** and difficulty > 1, difficulty **decreases**.

This is a simplified retarget tuned for early networks with variable solo-miner participation. Future upgrades may incorporate sliding-window median block times toward the **10-second** design target (`TargetBlockSec`).

### 6.3 Block Validity Rules

A block is accepted if:

- Proof-of-work verifies at declared difficulty.
- All parent hashes exist in local state.
- The block hash is not already known.
- Coinbase pays exactly **50 VELX** to `header.miner` (protocol constant at launch).
- Transactions do not double-spend available balances; fees flow to miner.

Invalid blocks are rejected without penalty to the submitter beyond wasted work—standard PoW economics.

### 6.4 CPU Mining at Launch

Initial difficulty is low (`InitialDifficulty = 4` in the reference implementation), enabling **consumer CPU** mining with `velox-miner` multithreading. This is intentional: VeloxDAG wants thousands of small miners before megawatt farms. ASIC resistance is not claimed as a permanent physics law—it is a **launch policy** that community governance may refine (e.g., algorithm rotation, increased memory hardness, or difficulty floors) if centralization appears.

### 6.5 Why PoW for a “Fast” Chain

Proof-of-Stake and permissioned BFT can be fast, but they optimize different trust assumptions. VeloxDAG chooses PoW because **mining is permissionless**, **auditable**, and **fair-launch compatible**—stake cannot be allocated at genesis if it never existed.

### 6.6 Energy and Security Budget

Proof-of-work consumes energy—that is the point. Energy cost sets a floor for rewriting history. VeloxDAG does not apologize for PoW; it embraces transparent energy spend over opaque stake cartels. Community initiatives can promote renewable mining, demand-response mining, and geographic diversity—but the security model remains economic.

### 6.7 Mining Pools (Emergent)

Pools may appear to smooth variance for small miners. VeloxDAG neither endorses nor forbids pools at the protocol layer. Miners should evaluate pool fee structures, payout transparency, and centralization risk. Solo mining remains the gold standard for decentralization at early hash rates.

### 6.8 Hardware Evolution

CPU launch does not imply CPU forever. If ASICs arrive, they do so without a premine beneficiary—only miners who took risk early benefit, and only if they hold VELX. That is still fairer than pre-allocated supply captured by non-mining insiders.

---

## 7. Fair Launch Tokenomics

**Fair launch** means the protocol does not enrich insiders at block zero. VeloxDAG’s tokenomics are brutally simple:

| Rule | Launch Value |
|------|----------------|
| Premine | **0 VELX** |
| ICO / SAFT / VC | **None** |
| Team allocation | **None at genesis** |
| Emission source | **100% coinbase + fees** |
| Initial block reward | **50 VELX** |
| Supply cap (launch client) | **Uncapped** (governance may propose caps) |

### 7.1 Genesis Semantics

The genesis block embeds a public message: *“VeloxDAG Fair Launch — No Premine, No ICO, No VC.”* It establishes initial difficulty and timestamp anchor but **does not mint spendable VELX to founders**. The genesis miner address is a neutral placeholder; coinbase rewards begin earning meaningful supply only as post-genesis blocks are mined and accepted.

### 7.2 Coinbase and Fees

Each accepted block grants **50 VELX** (`50_00000000` base units, 8 decimals) to the miner address in the header. Transaction fees, if present, add to the miner’s balance and total supply tracker. There are no protocol-level burns at launch.

### 7.3 Economic Fairness Argument

When supply is 100% mined:

- **Price discovery** happens in open markets, not in seed rounds.
- **Skin in the game** correlates with work performed or value exchanged with miners.
- **Narrative alignment** favors contributors who strengthen security, not slide decks.

Fair launch does not guarantee equality of outcomes—hash power is unequal. It guarantees equality of **issuance rules**.

### 7.4 What VeloxDAG Does Not Do

- No rebasing.
- No reflection taxes at protocol layer.
- No hidden mint keys in genesis JSON.
- No “ecosystem fund” siphoned at block 0.

If you hold VELX, you should be able to explain **how it entered circulation**. For VeloxDAG, the answer is: **mining or secondary transfer from a miner.**

### 7.5 Retail vs Insider Dynamics

Fair launch does not eliminate whales; it eliminates **free whales**. A miner who accumulates hash power earns VELX the same way a small laptop miner does—proportionally to blocks found. Markets may still concentrate supply post-mining, but that concentration is visible trading, not hidden mint buttons.

### 7.6 Communications Policy

VeloxDAG contributors avoid implying guaranteed profits. We describe mechanisms: premine zero, reward fifty, DAG parallel. Marketing may be energetic; economics must be literal.

### 7.7 Treasury

There is no protocol treasury at genesis. Future community treasuries—if created—should be funded by voluntary donations or post-launch fee allocations approved by miners, not by silent inflation.

---

## 8. Emission Schedule & Monetary Policy

### 8.1 Launch Emission

At mainnet launch, emission is:

**Reward per block = 50 VELX**  
**Block interval target ≈ 10 seconds**  
**Parents per block ≤ 2**

Theoretical upper bound on coinbase issuance (if exactly one block every 10 seconds):

- Per minute: up to ~300 VELX (6 blocks × 50)
- Per day: ~432,000 VELX
- Per year: ~157,680,000 VELX

In practice, early networks may produce **variable block rates** due to DAG parallelism and retarget dynamics—actual supply growth should be measured on-chain via `totalSupply` in node state, not spreadsheet ideals.

### 8.2 Fees

Transactions may attach fees to incentivize inclusion. Fees are **miner revenue** and increase tracked supply. At low congestion, fees may be minimal; as usage grows, fee markets complement block subsidies.

### 8.3 Long-Term Policy (Governance-Subject)

Bitcoin popularized halving schedules. VeloxDAG launches with a **constant 50 VELX** subsidy for predictability during bootstrapping. Community governance may later adopt:

- **Halving schedule** (e.g., every N blocks)
- **Tail emission** for permanent security budget
- **Fee-only tail** after subsidy sunset
- **Hard cap** proposals (e.g., 21B VELX) with client fork coordination

Any change requires social consensus and software adoption—VeloxDAG does not pretend a foundation can unilaterally edit monetary policy off-chain.

### 8.4 Supply Transparency

Nodes expose `totalSupply` and `blockCount` via RPC. Explorers and analytics tools can reproduce issuance from the DAG. **Trust, but verify**—and verification is a RPC call away.

### 8.5 Modeling Scenarios

Modelers should stress-test emission under variable block rates: if DAG tips proliferate and retarget raises difficulty, block frequency may differ from ideal 10-second spacing. Use on-chain `blockCount`/time rather than static spreadsheets.

### 8.6 Inflation and Store-of-Value Narratives

High initial emission favors **distribution** over **scarcity** early. That is intentional: VeloxDAG prioritizes getting coins into miners’ hands before optimizing for hoarding narratives. Long-term scarcity tools (halvings, caps) remain governance decisions with tradeoffs for security budget.

### 8.7 Comparison to Bitcoin’s Halving

Bitcoin’s halving schedule is legendary because it was credible and simple. VeloxDAG may adopt halving later, but only with miner supermajority—launch simplicity comes first.

### 8.8 Merchant Perspective

Merchants care about expected time-to-confirmation and fee stability. Constant block rewards stabilize miner incentives to include transactions even when fees are low—helpful during bootstrapping. As usage grows, fees should rise naturally, aligning mempool priority with user urgency without subsidizing spam via inflationary tricks.

### 8.9 Supply Dashboards

Community analytics should publish daily `totalSupply`, emission velocity, and active miner estimates derived from block timestamps and difficulty—making monetary policy legible to non-technical holders.

---

## 9. Security Model

VeloxDAG’s security model is **Nakamoto-style economic security** adapted to a BlockDAG:

### 9.1 Honest Majority Hash Power

The network is secure if the majority of hash power follows protocol rules. Attackers must out-work the honest DAG to rewrite history or sustain double-spends. Because tips can be parallel, defenders benefit from **aggregate** honest work across branches.

### 9.2 Full Nodes as Rule Enforcers

Anyone can run `veloxd` to validate proof-of-work, balances, and parenthood. Miners and exchanges should run full nodes; light clients may follow later. **Don’t trust—verify** remains the operational mantra.

### 9.3 Keys and Addresses

Wallets generate **velx1…** addresses with secp256k1 key material (see `velox-wallet`). Users must protect private keys, prefer offline signing for cold storage, and avoid phishing clones of the official site and repositories.

### 9.4 RPC Surface Hardening

The JSON-RPC server should not be exposed unauthenticated to the public internet without TLS and firewall rules. Rate limits, reverse proxies, and localhost-only binding are recommended defaults for solo miners.

### 9.5 Responsible Disclosure

Security reports should be sent to **security@veloxdag.com**. We appreciate coordinated disclosure before public exploitation.

### 9.6 Assurance Roadmap

Pre- and post-launch activities include static analysis (Slither-style tooling where applicable to contract layers), fuzzing, third-party review of consensus-critical changes, and bug bounties as treasury/community funding permits.

Security is not a state—it is a **process** tied to code changes and operational hygiene.

### 9.7 Exchange Integration Guidance

Exchanges listing VELX should run dedicated full nodes, define deposit confirmation thresholds based on DAG depth and orphan monitoring, and maintain hot wallet limits. Reorg risk is non-zero on any PoW chain; policies must reflect that.

### 9.8 Key Ceremony Hygiene

Teams publishing releases should sign binaries, publish checksums, and document reproducible build steps. Users should verify signatures before running miners with spendable keys.

### 9.9 Privacy at Launch

VeloxDAG does not implement protocol-level privacy at launch. Transparency aids auditability; users needing privacy must use operational opsec or future layers—not assumed defaults.

### 9.10 Threat Modeling Culture

Security reviews should enumerate assets (keys, RPC, P2P), adversaries (reorg attackers, scammers, nation-states), and mitigations (depth policies, signatures, monitoring). VeloxDAG encourages publishing threat models alongside releases so integrators inherit clarity.

### 9.11 Insurance and Custody

Custodians holding VELX must implement industry-standard key management (HSMs, multisig, withdrawal limits). Protocol fairness does not eliminate operational custody risk.

---

## 10. Attack Vectors & Mitigations

### 10.1 51% / Majority Hash Attacks

**Threat:** An attacker acquires majority hash power to reorganize recent blocks or double-spend against merchants.  
**Mitigation:** Economic cost of hardware and electricity; monitoring of orphan rates and tip divergence; merchant policies waiting for deeper DAG confirmations; community pool decentralization.

### 10.2 Selfish Mining

**Threat:** Miners withhold blocks to gain disproportionate rewards.  
**Mitigation:** DAG parallelism reduces some selfish-mining advantages vs single-chain niches; open miner participation; future protocol tweaks if measurable selfish behavior appears.

### 10.3 Double-Spend via Race

**Threat:** Attacker broadcasts conflicting transactions to different parts of the network.  
**Mitigation:** Exchanges wait for sufficient work depth; nodes enforce nonce ordering and balance checks; mempools evict invalid txs.

### 10.4 Sybil on P2P (Future)

**Threat:** Fake peers eclipse honest nodes.  
**Mitigation:** Peer diversity, anchor nodes, encrypted transport, stake-agnostic peer scoring—planned as P2P layer matures (port **37373** reserved).

### 10.5 RPC Abuse

**Threat:** Public RPC endpoints flooded or exploited.  
**Mitigation:** Bind locally, use auth/TLS, CAPTCHAs on public gateways, separate read replicas.

### 10.6 Eclipse + ISP-Level Attacks

**Threat:** Network partitioning.  
**Mitigation:** Multi-homed nodes, Tor/I2P support on roadmap, geographic distribution of seeders.

### 10.7 Social Engineering / Scam Forks

**Threat:** Malicious wallets or fake repos steal keys.  
**Mitigation:** Signed releases, checksum publishing, official domain **veloxdag.com**, verify GitHub org **veloxdag**.

### 10.8 Quantum (Long Horizon)

**Threat:** Shor-capable quantum computers break ECDSA.  
**Mitigation:** Monitor PQC standards; plan fork to quantum-resistant signatures when threat materializes.

No security document can promise invulnerability. VeloxDAG commits to **transparent rules**, **rapid patching**, and **honest communication** when incidents occur.

### 10.9 Supply Chain Attacks

Dependencies in Go modules should be pinned and reviewed. CI should build reproducible artifacts. Contributors must protect GitHub org access with hardware security keys where possible.

### 10.10 Denial of Service on Validators

Large blocks or transaction floods can stress nodes. `MaxMempool` bounds memory; future fee markets will price scarcity. Node operators should cap RPC body sizes and employ firewalls.

### 10.11 Governance Capture

Even without premine, governance capture via social media is possible. Mitigation: document upgrade paths on GitHub, require public rationale for parameter changes, and empower miners to reject bad forks by inaction.

### 10.12 Incident Response Playbook

On critical bugs: pause public endpoints if needed, publish postmortems, coordinate patched releases, and credit researchers who report responsibly.

### 10.13 Long-Range Attacks

Because VeloxDAG is PoW, long-range attacks require producing alternate histories with sufficient work. Full nodes syncing from genesis validate cumulative work; checkpoints may be published by the community as optional convenience for fast sync—never as consensus substitutes.

### 10.14 Fraud Proofs (Future)

If L2 layers emerge, fraud proof windows and challenge periods must be documented—base layer security does not automatically secure L2 bridges.

---

## 11. Technical Specifications

| Field | Specification |
|-------|----------------|
| **Chain name** | VeloxDAG |
| **Ticker** | VELX |
| **Smallest unit** | 1 satoshi-VELX (10⁻⁸ VELX) |
| **Coinbase (launch)** | 50 VELX = `5_000000000` base units |
| **Hash algorithm** | Double SHA-256 on header prefix ‖ nonce |
| **Difficulty encoding** | Integer target divisor; higher = harder |
| **Initial difficulty** | 4 |
| **Retarget interval** | Every 30 blocks |
| **Max parents** | 2 |
| **Target block time** | ~10 seconds (design goal) |
| **Max mempool txs** | 5,000 |
| **Address prefix** | `velx1` |
| **Genesis extra data** | Fair launch statement (non-premine) |
| **JSON-RPC port** | 8545 (default) |
| **P2P port (planned)** | 37373 |
| **Reference language** | Go 1.21+ |

### 11.1 Block Header Fields

- `version` (uint32)  
- `parents` ([]hash)  
- `timestamp` (unix seconds)  
- `difficulty` (uint64)  
- `nonce` (uint64)  
- `merkleRoot` (hex string)  
- `miner` (velx address)  
- `height` (uint64)  
- `extraData` (string, bounded by policy)

### 11.2 Transaction Fields

- `from`, `to`, `amount`, `fee`, `nonce`, `timestamp`, `signature`  
- Transaction ID = SHA256(canonical JSON fields)

### 11.3 State Storage

Reference node persists `chain.json` under user data directory (e.g., `~/.veloxdag`). Production deployments should plan for database backends as volume grows.

### 11.4 Interoperability Notes

Address format `velx1` is human-readable prefix notation similar in spirit to bech32 conventions, aiding copy/paste safety. Integrators should validate addresses before send.

### 11.5 Serialization and Hashing

Block IDs and transaction IDs use SHA-256 over canonical JSON subsets—integrators must match field ordering and omitted fields exactly or hashes will diverge.

### 11.6 Versioning

`version` field in headers enables future soft forks. Miners should advertise supported versions via node software releases.

### 11.7 Performance Expectations

Early mainnet volumes fit in-memory maps. High-throughput eras require benchmarking mempool eviction, tip pruning, and disk I/O—plan capacity before hype cycles, not after outages.

### 11.8 Test Vectors

Developers should publish golden test vectors: genesis hash, sample blocks, sample transactions, and expected RPC responses—so alternative clients can achieve compatibility.

### 11.9 Alternative Clients

Client diversity strengthens resilience. VeloxDAG welcomes reimplementations in Rust or other languages once test vectors stabilize—competition improves security.

---

## 12. Node Software Stack

VeloxDAG ships three primary binaries:

| Binary | Role |
|--------|------|
| **veloxd** | Full node + JSON-RPC server |
| **velox-miner** | CPU miner (getblocktemplate / submitblock loop) |
| **velox-wallet** | Key generation, address export |

### 12.1 Build

```bash
git clone https://github.com/veloxdag/veloxdag.git
cd veloxdag/chain
go build -o bin/veloxd ./cmd/veloxd
go build -o bin/velox-miner ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet
```

### 12.2 Run Node

```bash
./bin/veloxd -datadir ~/.veloxdag -port 8545
```

### 12.3 Health Endpoints

- `GET /health` → `{"status":"ok","chain":"VeloxDAG"}`
- `GET /api/info` → chain metadata (ticker, algorithm, premine 0%, block reward, tips, difficulty)

### 12.4 Future Components

- P2P gossip for block propagation  
- Archival indexer / explorer APIs  
- WASM contract runtime (see roadmap)  
- Mobile light clients

The stack is MIT-licensed open source; contributions via GitHub pull requests are welcome.

### 12.5 Deployment Topologies

**Solo home miner:** laptop runs `veloxd` + `velox-miner`. **Serious miner:** VPS runs node 24/7, miner on dedicated hardware. **Exchange:** clustered nodes behind load balancers with cold storage separation. Each topology shares the same consensus rules—only operations differ.

### 12.6 Observability

Log block acceptance, tip changes, difficulty retargets, and RPC errors. Prometheus exporters may be community-built; core binaries focus on correctness first.

### 12.7 Configuration Surface

`-datadir` controls state location; `-port` controls RPC bind. Operators should use process supervisors (systemd, docker restart policies) for uptime.

### 12.8 Docker and Packaging

Community Docker images may simplify deployment; verify image digests against signed releases. Container orchestration should not expose RPC ports publicly without authentication.

### 12.9 Upgrade Discipline

Read release notes before upgrading miners during active mining—consensus rule changes can orphan work if versions mismatch. Pin versions in production.

### 12.10 Testing

Run local devnets with low difficulty to validate wallet flows before mainnet mining. CI in the repository runs unit tests on pow verification and block acceptance.

---

## 13. RPC API Reference

VeloxDAG implements **JSON-RPC 2.0** over HTTP POST on `/`.

### 13.1 `getblocktemplate`

Returns a block template and mining prefix.

**Params:** `{ "miner": "velx1..." }` (required)

**Result:** `{ "block", "headerPrefix", "difficulty", "target" }`

### 13.2 `submitblock`

Submits a mined block.

**Params:** `{ "block": { ... } }`

**Result:** `{ "hash", "status": "accepted" }`

### 13.3 `getbalance`

**Params:** `{ "address": "velx1..." }`

**Result:** `{ "address", "balance", "formatted" }`

### 13.4 `sendrawtransaction`

Broadcasts transaction to mempool.

**Params:** transaction object

**Result:** `{ "txid", "status": "mempool" }`

### 13.5 `getchaininfo`

**Result:** `{ "chain", "blocks", "difficulty", "totalSupply", "tips", "fairLaunch" }`

### 13.6 `gettips`

**Result:** array of tip block hashes

### 13.7 Example

```bash
curl -s http://127.0.0.1:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getchaininfo","params":{},"id":1}'
```

### 13.8 Error Codes

Standard JSON-RPC errors apply (`-32700` parse, `-32601` method not found, `-32602` invalid params, `-32000` server errors).

### 13.9 Integration Patterns

Miners poll `getblocktemplate` in a loop, brute-force nonces locally, then `submitblock`. Wallets poll `getbalance`. Exchanges batch `sendrawtransaction` with nonce management off-chain in their accounting DB—but must respect on-chain nonces.

### 13.10 Rate Limits and Auth

Public RPC gateways should implement per-IP rate limits. Authenticated endpoints may be offered by infrastructure providers; core reference node remains simple.

### 13.11 Future Methods (Planned)

Potential extensions: `getblock`, `gettransaction`, `estimatesmartfee`, peer info RPCs—governed by semver and miner adoption.

### 13.12 Example: Balance Query

```bash
curl -s http://127.0.0.1:8545 -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"getbalance","params":{"address":"velx1..."},"id":1}'
```

### 13.13 Error Handling for Integrators

Treat `-32000` errors as potentially retryable for transient mempool issues; treat invalid PoW as permanent until template refresh. Always fetch a fresh `getblocktemplate` after stale work.

### 13.14 JSON Schema Stability

Field names in blocks and transactions should remain backward compatible within major versions; breaking changes require version bumps and miner coordination.

---

## 14. Mining Guide Summary

Mining VELX is designed to be **accessible**:

1. **Build** the toolchain (`veloxd`, `velox-miner`, `velox-wallet`).  
2. **Create wallet** — `./bin/velox-wallet new` → save `velx1…` address and key file securely.  
3. **Start node** — `./bin/veloxd -datadir ~/.veloxdag -port 8545`.  
4. **Mine** — `./bin/velox-miner -miner velx1YOUR_ADDRESS -threads 8`.

Each found block pays **50 VELX** coinbase to your miner address. Solo mining keeps **100% of rewards**—no pool fee at launch. Pools may emerge organically; verify pool reputation and payout schemes.

**Hardware:** Any modern CPU. More threads → more nonce trials. VPS hosting improves uptime.  
**Electricity:** Treat mining as a cost center until you sell or hold VELX.  
**Security:** Never share wallet files; mine to addresses you control.

Full tutorial: [https://veloxdag.com/tutorial](https://veloxdag.com/tutorial)

Early miners face **lower difficulty** and competition—classic fair-launch dynamics. As hash rate arrives, per-miner block frequency drops, but **per-block reward stays 50 VELX** until governance changes it.

### 14.5 Thread Tuning

Set `-threads` to physical cores for CPU mining; hyperthreading yields diminishing returns depending on architecture. Monitor thermals on laptops.

### 14.6 Expected Variance

Solo mining is a lottery—expect long dry spells without blocks. Patience or pooled mining reduces variance; fairness of issuance does not guarantee fairness of luck.

### 14.7 Operational Checklist

- Backup wallet JSON offline  
- Confirm `getchaininfo` block height increases  
- Monitor electricity costs vs market VELX price if trading  
- Upgrade binaries when release notes cite consensus changes

### 14.8 Ethics

Do not mine on hardware you do not own. Do not deploy malware miners. VeloxDAG condemns botnet mining categorically.

### 14.9 Pool Mining (When Available)

When pools emerge, compare payout schemes (PPS vs PPLNS), pool fees, and geographic latency. Verify pool software is open source when possible.

### 14.10 Profitability Notes

Profitability = (expected blocks × 50 VELX × price) − electricity − hardware depreciation. No protocol can promise positive profitability; market conditions dominate.

### 14.11 Community Support

Ask questions in Telegram with logs redacted of private keys. Official tutorial: veloxdag.com/tutorial.

---

## 15. Comparison: Bitcoin, Kaspa, BlockDAG, and VeloxDAG

| Dimension | Bitcoin (BTC) | Kaspa (KAS) | BlockDAG (project) | VeloxDAG (VELX) |
|-----------|---------------|-------------|--------------------|-----------------|
| **Structure** | Linear chain | BlockDAG | DAG narrative / implementation varies | BlockDAG (≤2 parents) |
| **PoW** | SHA-256 | kHeavyHash | Varies | Double SHA-256 |
| **Launch fairness** | Fair (historic) | Fair genesis ethos | Category-dependent | **0% premine, no ICO/VC** |
| **Block time** | ~10 min | Sub-second (network) | Marketing-fast | ~10 sec target |
| **Retail mining** | ASIC-dominated | GPU/ASIC era | Varies | **CPU at launch** |
| **Reward (initial)** | 50 BTC (historic) | Emission per KAS policy | Varies | **50 VELX** |
| **Maturity** | Maximum Lindy | High throughput proven | Brand + community | Early, open source |

**Bitcoin** remains the gold standard for neutrality and Lindy effect but cannot serve sub-minute retail payments without layers. **Kaspa** proved demand for fast PoW DAGs. **BlockDAG** popularized the category name. **VeloxDAG** targets participants who want the **architectural story** with a **clean cap table** and **transparent emission**.

No comparison implies investment superiority. Each network makes tradeoffs among speed, security budget, decentralization, and issuance politics.

### 15.1 When to Prefer Bitcoin

Choose BTC when you optimize for maximum Lindy, deepest liquidity, and simplest mental model (single chain). VeloxDAG does not attempt to replace BTC; it serves participants who want DAG speed **and** fair launch issuance.

### 15.2 When to Prefer Kaspa

KAS excels with mature high-BPS DAG operations and entrenched mining supply chains. VeloxDAG targets those who missed early KAS distribution but still believe in PoW DAG—without accepting premine baggage elsewhere.

### 15.3 When to Prefer VeloxDAG

Choose VELX if you value **transparent launch rules**, **CPU entry**, **50 VELX clarity**, and building on a young graph with open contributor slots.

### 15.4 Narrative vs Substance

Category names (“BlockDAG”) are not substitutes for reading code. Always verify premine, reward, and consensus—regardless of brand.

### 15.5 Liquidity and Maturity Tradeoff

Young networks trade liquidity depth for launch fairness. VeloxDAG accepts that trade consciously—early miners accept illiquidity risk in exchange for rules they can audit.

### 15.6 Composability

VeloxDAG does not claim EVM compatibility at launch. WASM roadmap targets safer sandboxing and explicit metering—different tooling, clearer security boundaries.

---

## 16. Ecosystem & Developer Roadmap

VeloxDAG’s ecosystem strategy is **infrastructure first, applications second**:

- **Explorers** indexing DAG tips, balances, and miners  
- **Mining pools** with transparent payout logs  
- **Wallets** (desktop, CLI, future mobile)  
- **Merchant plugins** accepting VELX with confirmation policies  
- **WASM smart contracts** for DeFi primitives without premine-funded “ecosystem bribes”  
- **Bridges** only after security review—cross-chain risk is real

Developers can integrate today via JSON-RPC. Build payment dashboards, mining profitability calculators, or Telegram bots reporting `getchaininfo`. Contract sandboxing arrives in later roadmap phases led by protocol engineers with mainnet security experience.

Grants may be discussed via **hello@veloxdag.com** once community treasury mechanisms exist—**not** via opaque insider allocations.

### 16.5 Application Ideas

Payment widgets for e-commerce, tipping bots, hash rate dashboards, DAG visualizers, and educational simulators are high-impact early apps. DeFi on WASM arrives later with audits.

### 16.6 Standards

When contract layers ship, VeloxDAG will document ABI standards, testnet faucets, and deployment checklists—mirroring lessons from Ethereum’s ERC ecosystem without copying its premine history.

### 16.7 Partnerships

Partnerships are welcome if they do not imply centralized control of consensus. Sponsored tutorials are fine; sponsored hard forks are not.

### 16.8 Open Source Norms

Contributors license patches under project terms, document breaking changes, and add tests for consensus paths. Good first issues include RPC examples, i18n docs, and explorer prototypes.

### 16.9 Education

University workshops teaching DAG concepts with VeloxDAG testnets help long-term decentralization—contact hello@veloxdag.com for academic collaboration.

### 16.10 Metrics Dashboard

A public dashboard (blocks/day, tips, difficulty, active addresses) builds trust—planned as community infrastructure.

### 16.11 Long-Term Ecosystem Thesis

Healthy ecosystems compound: more miners → more security → more merchant confidence → more transactions → more fees → more miner revenue. VeloxDAG seeds the flywheel with fair issuance so early security contributors are not competing with a parallel insider sell wall. Ecosystem partners should be evaluated on whether they strengthen that flywheel or merely extract attention.

---

## 17. Governance

VeloxDAG launches with **rough consensus and running code**. Formal on-chain governance is not day-one critical; monetary upgrades should follow:

1. **Public proposal** (GitHub / forum / Telegram)  
2. **Technical specification** with reference implementation PR  
3. **Review window** for client teams and miners  
4. **Activation** via block height or version bits when supermajority adopts

Off-chain coordination channels:

- Telegram: [https://t.me/VeloxDAG](https://t.me/VeloxDAG)  
- Twitter: [@VeloxDAG](https://twitter.com/VeloxDAG)  
- GitHub: [https://github.com/veloxdag](https://github.com/veloxdag)

Governance principles:

- **Miners veto irresponsible issuance changes** by not upgrading.  
- **Users vote with nodes** they trust.  
- **Developers propose, community disposes.**

VeloxDAG rejects plutocratic token-voting at launch because no premine exists to capture ballots. Governance power starts with **hash** and **code**.

### 17.5 Emergency Upgrades

If critical vulnerabilities appear, maintainers may publish patched releases quickly. Miners activate by upgrading binaries before a coordinated activation height announced on official channels. Social consensus timelines should be measured in days, not minutes—except for active exploitation scenarios.

### 17.6 Parameter Change Examples

Examples requiring governance: halving schedule, max block size, mempool limits, fee floor, P2P port defaults, contract gas schedules.

### 17.7 Anti-Patterns

Avoid off-chain multisigs that promise to “control” consensus. Avoid snapshot votes by non-mining whales acquired OTC to override hash-weighted reality.

### 17.8 Transparency Reports

Quarterly transparency reports—voluntary from maintainers—can summarize security fixes, grant disbursements, and hashrate observations without corporate theater.

### 17.9 Fork Etiquette

Contentious forks should rebrand tickers if consensus fails to converge—protect users from asset confusion.

### 17.10 Documentation as Governance

Accurate docs reduce accidental forks. When RPC or consensus changes, update litepaper sections and bump document version. Stale documentation is a governance failure.

### 17.11 International Coordination

Governance calls may rotate time zones to include Asian, European, and American miners—hash is global, so voice should be too.

---

## 18. Community & Participation

VeloxDAG is a **community-first** network. Ways to participate:

- **Mine** VELX with `velox-miner`  
- **Run nodes** to strengthen validation decentralization  
- **Translate** docs and tutorials  
- **Report bugs** and submit PRs  
- **Create content** explaining fair launch and DAG mechanics honestly—no guaranteed returns  
- **Organize regional meetups** and mining workshops

Community norms:

- No harassment.  
- Disclose conflicts when promoting pools or services.  
- Mark speculation as speculation.  
- Welcome newcomers; elitism kills fair launch networks.

The fair launch ethos only works if **culture** matches **code**. VeloxDAG contributors strive to model that alignment.

### 18.5 Content Creators

Honest educators grow sustainable communities. Disclose sponsorships. Correct mistakes publicly. VeloxDAG will amplify accurate technical content where possible.

### 18.6 Regional Communities

Localized Telegram groups help onboard non-English miners. Respect local laws regarding mining and trading.

### 18.7 Conflict Resolution

Disputes among contributors resolve via public GitHub issues and maintainer consensus—transparently documented.

### 18.8 Onboarding Paths

Newcomers: read litepaper → run node → mine testnet/mainnet → join Telegram → open first PR (docs/mining guides welcome).

### 18.9 Memes and Culture

Memes are welcome; misinformation is not. Moderators may remove scam links and fake airdrops pretending to be VeloxDAG.

### 18.10 Events

Hackathons focused on DAG tooling and fair launch education align with project values more than speculative price parties.

### 18.11 Volunteer Moderation

Telegram moderators volunteer to reduce scams; they are not financial advisors. Follow official links from veloxdag.com only.

### 18.12 Measuring Community Health

Healthy signals: rising unique miner addresses, increasing GitHub contributors, quality technical threads. Unhealthy signals: price-only discussion, undisclosed shilling, fake giveaway bots.

---

## 19. Team

VeloxDAG is engineered by builders who ship production software—not slide decks. Core contributors **mine VELX like everyone else**; there is no genesis privilege.

### Joseph Chen — Lead Protocol & Security Engineer

Joseph Chen is an independent Web3 developer with **5+ years** of production experience and **five shipped mainnet projects**. He specializes in Solidity smart contracts, DeFi protocol design, and security-first engineering using Foundry fuzz testing and Slither static analysis.

At VeloxDAG, Joseph leads **protocol security review**, **RPC hardening**, **mining infrastructure**, and the **WASM smart contract roadmap**. Representative work includes:

- **SecureFlow** — AI-assisted smart contract security scanning  
- **MeowCoin** — ERC-20 reference implementation  
- **CatnipFarm** — Synthetix-style staking mechanics  
- **PawClaim** — Merkle airdrop infrastructure  
- **CatVesting** — linear vesting contracts  

Joseph believes **fair-launch PoW** is the antidote to VC-captured tokenomics—and ships code accordingly.

- Website: [http://josephchendev.com/](http://josephchendev.com/)  
- GitHub: [https://github.com/SelfLearnedDev2027](https://github.com/SelfLearnedDev2027)  
- Email: Josephbbob@proton.me  

Want to contribute? Email **hello@veloxdag.com** or join Telegram **t.me/VeloxDAG**.

### 19.1 Engineering Philosophy

Joseph’s portfolio emphasizes **security tooling** and **DeFi mechanics**—skills directly applicable to WASM contract rollout and RPC hardening. Fair launch is not a moral pose alone; it is a constraint that forces sustainable engineering incentives.

### 19.2 Contributors Beyond Core

VeloxDAG anticipates community maintainers for explorers, pools, and translations. Credit is given in release notes and on the website team page as roles solidify.

### 19.3 Hiring Stance

There is no premine payroll. Contributors may receive donations or future grant funding voted by the community—never hidden genesis allocation.

### 19.4 Advisors

VeloxDAG does not advertise paid advisor cabinets at launch. Technical advisors may be named publicly only with disclosed compensation and scope—avoiding opaque influence.

### 19.5 Accountability

Core engineers are accountable via public commits and issue trackers. Reputation is earned in git history, not in pitch decks.

### 19.6 Security Contact

Joseph and maintainers coordinate via security@veloxdag.com for vulnerability reports; public issues should not include exploit details before patch.

### 19.7 Open Roles

As the network grows, roles may expand for DevRel, client diversity, and explorer maintenance—always with transparent compensation sources.

---

## 20. Legal Disclaimer & Risk Factors

**This litepaper is for informational purposes only.** It does not constitute investment, legal, tax, or financial advice. VELX may have no value; markets are volatile. You may lose all funds spent on mining equipment, electricity, or purchases.

**Regulatory uncertainty:** Digital assets face varying regulations globally. Compliance is your responsibility.

**Software risk:** Blockchain software may contain bugs leading to loss of funds. Use at your own risk; audit before relying on significant value.

**No warranties:** VeloxDAG software is provided **as-is** without warranties of merchantability or fitness.

**Not an offer:** Nothing herein is an offer to sell securities or investment contracts.

**Forward-looking statements:** Roadmap items may change or delay.

Consult qualified professionals before mining, trading, or building regulated services on VeloxDAG.

### 20.1 Jurisdiction

Laws differ on mining, staking-like services, money transmission, and securities classification. Entities building on VeloxDAG must perform independent legal analysis.

### 20.2 Tax

Mining income may be taxable when coins are received or when sold—depending on jurisdiction. Track cost basis diligently.

### 20.3 Consumer Protection

Do not promise guaranteed returns in any jurisdiction. Mark speculative assets clearly in UI.

### 20.4 AML/KYC

VeloxDAG software does not implement AML/KYC. Exchanges and brokers may; that is their compliance burden.

### 20.5 Intellectual Property

Trademarks and logos may be protected to prevent scam impersonation. Open source code remains available under project license terms.

### 20.6 Limitation of Liability

To the maximum extent permitted by law, contributors are not liable for losses arising from software defects, market movements, or user error—participants assume full risk.

### 20.7 No Fiduciary Relationship

Reading this litepaper or using VeloxDAG software does not create a fiduciary, advisory, or partnership relationship with contributors.

### 20.8 Sanctions and Geopolitics

Participants must comply with applicable sanctions and export controls when operating infrastructure or facilitating transfers.

---

## 21. Roadmap

### Phase 1 — Launch Foundation (2026 Q2)

- Mainnet genesis with **0% premine**  
- Release `veloxd`, `velox-miner`, `velox-wallet`  
- JSON-RPC stabilization and documentation  
- CPU mining guide and website launch  
- Community channels live (Telegram, Twitter)

### Phase 2 — Network Hardening (2026 Q3)

- P2P gossip layer (port 37373)  
- Improved DAG ordering / confirmation documentation in clients  
- Explorer and pool ecosystem support  
- Security audits on consensus-critical modules  
- Bug bounty program

### Phase 3 — Developer Platform (2026 Q4)

- WASM smart contract testnet  
- Contract SDK and deployment tooling  
- Indexer APIs for applications  
- Mobile wallet research

### Phase 4 — Scale & Governance (2027+)

- Parameter upgrades via miner-coordinated forks (halving debate, fee market tuning)  
- Cross-chain bridges (security-first, optional)  
- Layer-2 research if base layer metrics justify  
- Geographic community grants funded by community donations—not premine

Dates are aspirational. **Shipped code** supersedes timeline slides.

### 21.1 Success Metrics

Phase success is measured by: active node count, solo miner diversity, zero critical unpatched exploits, working explorer, and organic pool formation—not by exchange listing count alone.

### 21.2 Non-Goals (2026)

VeloxDAG is not prioritizing enterprise permissioned chains, ICO platforms, or NFT-first roadmaps at launch. Focus wins.

### 21.3 Community Feedback Loops

Each phase ends with a public retrospective: what shipped, what slipped, what miners need next.

### 21.4 Dependency Risks

Roadmap items depend on contributor bandwidth, audit availability, and community funding. Delays are possible; communicate early rather than over-promise.

### 21.5 How to Influence Priority

Miners and developers influence priority by building: PRs, pools, explorers, and usage metrics speak louder than poll spam.

---

## 22. Conclusion

VeloxDAG exists because the market asked for **speed** and deserved **honesty**. BlockDAG architecture delivers parallel block production and a credible answer to linear chain bottlenecks. Proof-of-work delivers permissionless security. **Fair launch** delivers a social contract that insiders cannot dilute at genesis.

**50 VELX per block.** **SHA-256 proof-of-work.** **Zero premine.** **CPU mining at launch.** These are not slogans—they are parameters you can query from a node.

The next era of PoW will not be won by the project with the loudest conference booth. It will be won by the network where **participants trust the rules** because they can **run the rules**.

Start a node. Start a miner. Read the code. The DAG is waiting.

VeloxDAG is a bet that the crypto industry can still launch networks the right way: no hidden supply, no permissioned issuance, no false promises of guaranteed upside. It is a bet that **miners matter**—not as retro nostalgia, but as the decentralization backbone. It is a bet that **BlockDAG** is not just a 2024 keyword, but a durable ledger shape for payments and applications that refuse to wait ten minutes per confirmation.

If you have read this far, you understand the parameters: **50 VELX**, **SHA-256 PoW**, **zero premine**, **CPU-friendly launch**, **two parents**, **ten-second targets**. Everything else is execution—yours and ours together. Welcome to VeloxDAG.

---

**VeloxDAG · VELX · Fair Launch PoW BlockDAG**

[https://veloxdag.com](https://veloxdag.com) · [hello@veloxdag.com](mailto:hello@veloxdag.com) · [security@veloxdag.com](mailto:security@veloxdag.com)

*Document version 1.0 — May 2026*
