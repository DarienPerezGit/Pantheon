# Pantheon
### Autonomous agents that pay for data.
HTTP 402 protocol implementation for seamless machine-to-machine micropayments on Stellar.

**Pantheon** solves the "payment wall" problem for AI agents by providing a standardized, ultra-fast, and low-fee architecture for autonomous data procurement using USDC.

---

## 🏆 Demo Links
*   **Live Dashboard**: [pantheon-theta.vercel.app](https://pantheon-theta.vercel.app/demo)
*   **Video Demo**: [YouTube Link / Coming Soon]
*   **API (Railway)**: [Backend Status](https://hearty-enchantment-production.up.railway.app/health)
*   **Stellar Explorer**: [Verified Transactions](https://stellar.expert/explorer/testnet/address/GDYJ5LX3Q5LVSZ3GXWIGEZP22VPRXEK4IWJGJVDF5M6WJIEHF3ZK4NDS)

---

## 🛑 The Problem
**Agents can't pay.** Current API monetization is built for humans: credit cards, monthly subscriptions, and manual API keys. This creates a "bottleneck of human approval" that stops autonomous agents from accessing premium data in real-time. If an agent needs a specific piece of data *now*, it shouldn't need a subscription; it should pay for that single interaction.

## ⚡ The Solution
**Pantheon** implements the **x402 protocol** on Stellar. It's a full-stack architecture where a Consumer Agent autonomously negotiates, pays (micropayments in USDC), and verifies data delivery without human intervention.
*   **No credit cards.**
*   **No monthly plans.**
*   **Just pay-per-request** at the protocol level (HTTP 402).

---

## ✨ Key Features
*   **Auto-Monetization**: Signal API responds with a native HTTP 402 "Payment Required" challenge.
*   **Trustless Verification**: Server verifies Stellar TX proof against Horizon API before delivering data.
*   **AI-Native Reasoning**: Consumer uses Llama 3 (via Groq) to decide *if* a signal is worth buying.
*   **Stablecoin Standard**: Pure USDC flow on Stellar Testnet for real-world price stability.
*   **Ultra-Low Fees**: Sub-cent transaction costs ideal for frequent micropayments.

---

## 🛠 How it Works

```text
1. Consumer  ─── GET /signal ─────▶  Signal API (Railway)
2. Consumer  ◀─── HTTP 402 ────────  (Instructions inside)
3. Consumer  ─── Pay 0.10 USDC ───▶  Stellar Network
4. Consumer  ─── GET /signal + TX ──▶  Signal API
5. API       ─── Verifies TX ─────▶  Horizon API
6. API       ◀─── 200 OK + Signal ──  (BUY/SELL Data)
7. Consumer  ─── Process with LLM ──▶ Groq / Llama 3
```

---

## 🏗 Architecture & Stack
### Components
*   **Frontend**: Next.js dashboard for real-time cycle monitoring.
*   **Backend**: Production-ready Go API (Railway) with dynamic porting and Docker.
*   **Agent**: Python autonomous consumer with AI reasoning logic.
*   **Payments**: Stellar SDK for asset-based USDC transactions.

### Tech Stack
*   **Next.js 15 + Tailwind** (Dashboard)
*   **Go 1.22** (Signal API)
*   **Python 3.11** (Autonomous Agent)
*   **Docker** (Cloud Deployment)
*   **Groq / Llama 3 / Claude** (AI Decision Layer)

---

## 💎 What makes it special
1.  **Stellar Asset Native**: Unlike other x402 implementations, we use native USDC assets, not just native tokens, making it enterprise-ready.
2.  **Anti-Replay Protection**: The API tracks consumed TX hashes in-memory to prevent payment double-spending.
3.  **Deployment Parity**: Identical behavior in local Docker environments and production cloud (Railway/Vercel).

---

## 🚀 Quickstart
Get Pantheon running locally in less than 5 minutes.

### 1. Requirements
*   Docker & Docker Compose
*   Stellar Testnet Wallets (2)

### 2. Setup
```bash
git clone https://github.com/DarienPerezGit/Pantheon.git
cd Pantheon
cp .env.example .env
# Edit .env with your GROQ_API_KEY and Stellar Keys
```

### 3. Run
```bash
# Start both API and Agent automatically
docker-compose up --build
```

---

## 📋 Environment Variables
| Variable | Description | Example |
| :--- | :--- | :--- |
| `SERVER_PUBLIC_KEY` | Stellar wallet for receiving payments | `GBZW...` |
| `GROQ_API_KEY` | API Key for Llama 3 Signals | `gsk_...` |
| `SIGNAL_PRICE_USDC` | Price per request in USDC | `0.10` |
| `HORIZON_URL` | Stellar network endpoint | `https://horizon-testnet.stellar.org` |

---

## 🗺 Roadmap
*   **V2 - Escrow Layer**: Dynamic pricing based on data quality.
*   **Mainnet Launch**: Migration to Stellar Mainnet.
*   **Marketplace SDK**: Allow anyone to wrap any API with an x402 layer in 1 command.
*   **Multi-Agent Support**: Swarms of agents buying data from each other.

---

## 👥 Team
*   **Darien Perez** - Lead Architect & Core Developer - [GitHub](https://github.com/DarienPerezGit)

---

## 🏛 Track Alignment
*   **Built for**: *Agentic Payments Track*. 
*   **Why it wins**: It demonstrates a complete end-to-end loop: Request -> 402 -> Payment -> Delivery -> AI Decision. It's not just a demo; it's a protocol.

---

## 📄 License
MIT License. Built for **Stellar Hacks: Agents**.
