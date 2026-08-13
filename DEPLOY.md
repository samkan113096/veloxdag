# VeloxDAG — Deployment Guide

> ⚠️ **Do not store real credentials in this file.** This repository may be
> public. Keep passwords, SSH keys, and API tokens in a password manager or
> environment secrets instead. If a real secret has ever been committed here,
> rotate it immediately (see "Security — rotate before launch" below).

---

## Quick answer: yes, the launch checklist is:

1. **Start the VPS node** (1 command — see below)
2. **Website is already live on Netlify** — nothing to do unless you push new code
3. **Custom domain** — point your Namecheap domain to Netlify (one-time DNS change)

That's it. The chain resumes from where it left off.

---

## Credentials & Access

| Service | Value |
|---|---|
| VPS IP | `66.94.106.193` |
| VPS SSH user | `root` |
| VPS SSH auth | **SSH key (recommended)** — store in password manager, NOT here |
| VPS OS | Ubuntu 22.04 |
| Chain data dir | `/var/lib/veloxdag/` (chain.json saved here) |
| Node binary | `/opt/veloxdag/chain/bin/veloxd` |
| Miner binary | `/opt/veloxdag/chain/bin/velox-miner` |
| Netlify site | `https://veloxdag.netlify.app` |
| Netlify team / login | your Netlify account (connected to GitHub) |
| GitHub repo | `https://github.com/samkan113096/veloxdag` |
| Node RPC port | `8545` (public, open in firewall) |
| P2P port | `37373` (public, open in firewall) |
| Email port | `25` (untouched — your email server) |

---

## Part 1 — Starting / Stopping the VPS Node

### Start (launch day)

```bash
ssh root@66.94.106.193   # authenticate with your SSH key

sudo systemctl start veloxdag
sudo systemctl enable veloxdag   # auto-restart on reboot
```

> **IMPORTANT — consensus upgrade requires a fresh genesis.** The August 2026
> security hardening changed consensus rules (signature verification, block
> height/timestamp validation). Any node running the old binary or old chain
> data is incompatible. Before starting, deploy the new binary and reset the
> chain once:

```bash
sudo systemctl stop veloxdag
rm -f /var/lib/veloxdag/chain.json
sudo systemctl start veloxdag
```

The node starts from genesis (0 premine, 0 supply) and miners can connect immediately.

### Verify it's running

```bash
systemctl status veloxdag          # should say "active (running)"
curl http://localhost:8545/health  # should return {"status":"ok",...}
curl http://66.94.106.193:8545/api/stats   # public chain stats JSON
```

### Stop (maintenance / future pause)

```bash
sudo systemctl stop veloxdag
sudo systemctl disable veloxdag    # prevents auto-start on reboot
```

---

## Part 2 — Website (Netlify)

The website is a Next.js static site deployed on Netlify.  
It auto-deploys every time you push to the `main` branch on GitHub.

### Normal workflow (update the site)

```bash
cd "/Users/samkan/New Blockchain"

# Make your changes to website/src/...

git add .
git commit -m "your message"
git push origin main
```

Netlify detects the push and rebuilds automatically (takes ~2 min).
Live at: **https://veloxdag.xyz** (Netlify: `veloxdag.netlify.app`)

### Manual redeploy (no code changes)

1. Go to https://app.netlify.com
2. Open the `veloxdag` site
3. Click **Deploys → Trigger deploy → Deploy site**

### Netlify environment variable (required for proxy)

The Netlify function `velox-rpc.js` proxies browser requests to your VPS node.
It needs this environment variable set in Netlify:

| Key | Value |
|---|---|
| `VELOX_RPC_BACKEND` | `http://66.94.106.193:8545` |

To check / update:
1. Netlify dashboard → Site → **Environment variables**
2. If missing, add it with the value above and trigger a redeploy

---

## Part 3 — Custom Domain (Namecheap → Netlify)

The canonical domain is **`veloxdag.xyz`**. If it's not yet connected:

### Step 1 — Add the domain in Netlify

1. Netlify dashboard → **Domain settings → Add custom domain**
2. Type `veloxdag.xyz` → Verify → Add domain
3. Netlify will show you DNS records to add

### Step 2 — Update DNS in Namecheap

1. Login to Namecheap → **Domain List → Manage** `veloxdag.xyz`
2. Go to **Advanced DNS**
3. Add these records (Netlify will give you the exact values):

| Type | Host | Value |
|---|---|---|
| `CNAME` | `www` | `veloxdag.netlify.app` |
| `A` | `@` | Netlify's load balancer IP (shown in their UI) |

4. Wait 5–30 minutes for DNS to propagate

### Step 3 — Enable HTTPS

Netlify provisions a free Let's Encrypt SSL cert automatically once DNS is live.
You'll see a green "Your site has HTTPS enabled" message in the dashboard.

---

## Part 4 — How the Live Stats Work

```
User browser
    │
    ▼
veloxdag.netlify.app/wallet  (or /)
    │
    ▼ fetch POST
/.netlify/functions/velox-rpc?path=stats
    │  (Netlify serverless function, file: website/netlify/functions/velox-rpc.js)
    │
    ▼ HTTP to VELOX_RPC_BACKEND
http://66.94.106.193:8545/api/stats
    │  (VPS node — must be running)
    │
    ▼
Live JSON stats → displayed in frontend
```

If the node is stopped, the frontend will show "Error loading stats" — that's normal.
Stats come back the moment you start the node again.

---

## Part 5 — Outside Miners Connecting

Anyone can mine VELX by pointing the miner at your VPS:

```bash
# Download and build (requires Go 1.22+)
git clone https://github.com/samkan113096/veloxdag.git
cd veloxdag/chain
go build -o bin/velox-miner ./cmd/velox-miner
go build -o bin/velox-wallet ./cmd/velox-wallet

# Create a wallet
./bin/velox-wallet new

# Mine (replace YOUR_ADDRESS and adjust -threads)
./bin/velox-miner \
  -miner YOUR_VELX_ADDRESS \
  -rpc http://66.94.106.193:8545 \
  -threads $(nproc)       # Linux
  # -threads $(sysctl -n hw.ncpu)  # macOS
```

They connect to port `8545` (RPC) and `37373` (P2P). Both are open in the firewall.

---

## Part 6 — VPS File Layout

```
/opt/veloxdag/
├── chain/
│   ├── bin/
│   │   ├── veloxd          ← node
│   │   ├── velox-miner     ← CPU miner
│   │   └── velox-wallet    ← wallet CLI
│   └── ...

/var/lib/veloxdag/
└── chain.json              ← ALL chain state (blocks, balances, UTXOs)
                               NEVER delete this — it's the blockchain

/etc/systemd/system/
└── veloxdag.service        ← systemd service definition
```

### Backing up the chain

```bash
# On VPS — copy chain.json somewhere safe before any updates
scp root@66.94.106.193:/var/lib/veloxdag/chain.json ~/veloxdag-backup-$(date +%Y%m%d).json
```

---

## Part 7 — Updating Binaries on VPS

If you change Go code and need to redeploy the node binary:

```bash
# 1. Build locally
cd "/Users/samkan/New Blockchain/chain"
GOOS=linux GOARCH=amd64 go build -o bin/veloxd-linux ./cmd/veloxd
GOOS=linux GOARCH=amd64 go build -o bin/velox-miner-linux ./cmd/velox-miner

# 2. Copy to VPS
scp chain/bin/veloxd-linux root@66.94.106.193:/opt/veloxdag/chain/bin/veloxd
scp chain/bin/velox-miner-linux root@66.94.106.193:/opt/veloxdag/chain/bin/velox-miner

# 3. Restart
ssh root@66.94.106.193 'systemctl restart veloxdag'
```

---

## Part 8 — Full Launch Day Checklist

- [ ] Deploy the **new** binary to the VPS and **re-genesis** (`rm -f /var/lib/veloxdag/chain.json`)
- [ ] `ssh root@66.94.106.193` → `systemctl restart veloxdag && systemctl enable veloxdag`
- [ ] Visit `https://veloxdag.xyz` — live stats should appear within 10s
- [ ] Visit `/wallet` — create a wallet, check balance
- [ ] (Optional) Point custom domain in Namecheap → Netlify
- [ ] Announce on Twitter / Telegram — share the mining tutorial link
- [ ] Share miner command: `./bin/velox-miner -miner YOUR_ADDRESS -rpc http://66.94.106.193:8545 -threads $(nproc)`

---

## Part 9 — Troubleshooting

| Problem | Fix |
|---|---|
| Live stats show "Error" | VPS node is stopped → `systemctl start veloxdag` |
| Wallet shows 0 balance | Node is stopped — balance queries go through the Netlify proxy to the VPS |
| `Permission denied` on SSH | Add your SSH public key (or use the password stored in your password manager) |
| Miner can't connect | Check firewall: `ufw status` on VPS; ports 8545 + 37373 must be open |
| Website not updating | Push to GitHub main branch or manually trigger deploy in Netlify |
| Chain data lost | Restore from backup: `scp backup.json root@66.94.106.193:/var/lib/veloxdag/chain.json` |

---

## Security — rotate before launch

Because a real password was previously committed to this repository's history,
assume it is compromised and rotate everything:

1. **Rotate the VPS root password** — `passwd` on the VPS, or better, disable
   password auth entirely and use SSH keys only.
2. **Rotate the GitHub token** — a personal access token was embedded in the
   local `git remote`. Revoke it at GitHub → Settings → Developer settings →
   Personal access tokens, then switch the remote to SSH or a fresh token.
3. **Consider** rewriting git history (`git filter-repo`/BFG) to purge the old
   secret from past commits if the repo is or ever was public.

---

*VeloxDAG — built fair, launched clean.*
