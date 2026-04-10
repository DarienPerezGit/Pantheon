# Pantheon

> **Stellar Hacks: Agents — Hackathon submission**
> An autonomous trading agent that pays micropayments on Stellar to purchase real-time trading signals — machine-to-machine, no human required.

---

## What it does

Signal Agent Marketplace implements the **x402 protocol** on Stellar: a consumer agent autonomously decides when to buy a trading signal, pays 0.10 XLM to a signal provider API, and uses a LLM (Groq / Llama 3.1 8B) to reason about whether to execute — all in a continuous loop.

```
Consumer Agent  ──GET /signal──▶  Signal API (Go)
                ◀──── 402 ──────  (payment instructions)
                ──pay 0.10 XLM──▶  Stellar Testnet
                ──GET /signal──▶  (X-Payment: <tx_hash>)
                ◀── BUY/SELL ───  LLM-generated signal
                ──prompt──▶ Groq  (execute decision)
                ◀──execute:true── LLM reasoning
```

## Problem solved

**Agents can't pay.** The x402 protocol fixes this: HTTP 402 becomes a native monetization layer for machine-to-machine transactions. Stellar is ideal — 5-second finality, sub-cent fees, no smart contracts required.

## Architecture: LLM-agnostic by design

The system is designed to work with any OpenAI-compatible LLM API. Currently using **Groq (Llama 3.1 8B Instant)** for the consumer agent decision layer — zero-cost, ~200ms inference.

The Signal API (Go) is also wired to support Claude for signal generation (falls back to mock if key is empty). This demonstrates that the architecture is fully provider-agnostic.

## Live demo — Verified transactions on Stellar testnet

All transactions are publicly verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet).  
**Consumer wallet:** `GDYJ5LX3Q5LVSZ3GXWIGEZP22VPRXEK4IWJGJVDF5M6WJIEHF3ZK4NDS`  
**Server wallet:** `GBZWI25VLQRRNZOZAPPYLSGME5HPLAWYN3BUE3ZPRHBZSNGIS4U62XVN`

| Cycle | Timestamp (UTC) | TX Hash | Explorer |
|-------|-----------------|---------|----------|
| smoke test | 2026-04-10 03:08 | `3b8d6df58b5a3b742669da8d624b7b08262b338e2924f7650f9ff546db5df377` | [View ↗](https://stellar.expert/explorer/testnet/tx/3b8d6df58b5a3b742669da8d624b7b08262b338e2924f7650f9ff546db5df377) |
| 1 | 2026-04-10 03:39 | `8da141197bd0d38405f06b130f19417494e6eb7b255533a34536c901c0a44443` | [View ↗](https://stellar.expert/explorer/testnet/tx/8da141197bd0d38405f06b130f19417494e6eb7b255533a34536c901c0a44443) |
| 2 | 2026-04-10 03:39 | `378a2acc6484391776612933c60d27677a3be6cacffcd2dca76fb0ac57387781` | [View ↗](https://stellar.expert/explorer/testnet/tx/378a2acc6484391776612933c60d27677a3be6cacffcd2dca76fb0ac57387781) |
| 3 | 2026-04-10 03:40 | `fb029dce79a09c2a6751fbb4bc84edc207ece742a590cf45fb8597da73a0b6ae` | [View ↗](https://stellar.expert/explorer/testnet/tx/fb029dce79a09c2a6751fbb4bc84edc207ece742a590cf45fb8597da73a0b6ae) |
| 4 | 2026-04-10 03:41 | `9ee6a5624686e5a82f0c6ee36d7087903a2c7161d00e28e072ac4d501a25d7f8` | [View ↗](https://stellar.expert/explorer/testnet/tx/9ee6a5624686e5a82f0c6ee36d7087903a2c7161d00e28e072ac4d501a25d7f8) |
| 5 | 2026-04-10 03:41 | `99f9859ceef8eb52c69f1e56d6c784c5aa1c930e40a35128167981578d0646ba` | [View ↗](https://stellar.expert/explorer/testnet/tx/99f9859ceef8eb52c69f1e56d6c784c5aa1c930e40a35128167981578d0646ba) |
| 6 | 2026-04-10 03:42 | `ab3fb83f58ca190bd1bfa15db89af4b23485c51f1a8a12970169364cb3e49e1b` | [View ↗](https://stellar.expert/explorer/testnet/tx/ab3fb83f58ca190bd1bfa15db89af4b23485c51f1a8a12970169364cb3e49e1b) |
| 7 | 2026-04-10 03:43 | `3932b50730ba4d437bec5f8b00931282989632343dc8423cd4ad27bc5991b4ae` | [View ↗](https://stellar.expert/explorer/testnet/tx/3932b50730ba4d437bec5f8b00931282989632343dc8423cd4ad27bc5991b4ae) |
| 8 | 2026-04-10 03:43 | `5d312210590f342e9839549491c8d801ea34f8742c560e7364adab270e2c10c8` | [View ↗](https://stellar.expert/explorer/testnet/tx/5d312210590f342e9839549491c8d801ea34f8742c560e7364adab270e2c10c8) |
| 9 | 2026-04-10 03:44 | `f950b16694a57aa7add1b458ee42e1409447933345c416da2e7d407f35f31581` | [View ↗](https://stellar.expert/explorer/testnet/tx/f950b16694a57aa7add1b458ee42e1409447933345c416da2e7d407f35f31581) |
| 10 | 2026-04-10 03:45 | `45114c52e7b4841aab1713bac57ce1b18f1e24baf4c05ad17733b21356a7946a` | [View ↗](https://stellar.expert/explorer/testnet/tx/45114c52e7b4841aab1713bac57ce1b18f1e24baf4c05ad17733b21356a7946a) |
| 11 | 2026-04-10 03:45 | `407f8cca99909ce9015607b9c61b6a8e0530f7ddd481e3d5aaae8334fc2594d6` | [View ↗](https://stellar.expert/explorer/testnet/tx/407f8cca99909ce9015607b9c61b6a8e0530f7ddd481e3d5aaae8334fc2594d6) |
| 12 | 2026-04-10 03:46 | `4b8a30a59a01332bb1abb903875964920276eb7f1c7b4c324a841f468ed4bdb3` | [View ↗](https://stellar.expert/explorer/testnet/tx/4b8a30a59a01332bb1abb903875964920276eb7f1c7b4c324a841f468ed4bdb3) |
| 13 | 2026-04-10 03:47 | `4008b4514615d4d2bd53aaf683289cd828936f739395d4466b0e32d08ef7b004` | [View ↗](https://stellar.expert/explorer/testnet/tx/4008b4514615d4d2bd53aaf683289cd828936f739395d4466b0e32d08ef7b004) |
| 14 | 2026-04-10 03:47 | `a6679e22a3af037ed439eaaa7ec2085f1625888e316eec2fefb8cf4228e1401a` | [View ↗](https://stellar.expert/explorer/testnet/tx/a6679e22a3af037ed439eaaa7ec2085f1625888e316eec2fefb8cf4228e1401a) |
| 15 | 2026-04-10 03:48 | `bdaa7d5d4838e8fb1a4592e71415ed516c0a83fa192dfb1d79dfe0544b8533bf` | [View ↗](https://stellar.expert/explorer/testnet/tx/bdaa7d5d4838e8fb1a4592e71415ed516c0a83fa192dfb1d79dfe0544b8533bf) |
| 16 | 2026-04-10 03:49 | `cdf4af976f6de29181321967ffda653402e72806da4b87e1bfe42c16096af459` | [View ↗](https://stellar.expert/explorer/testnet/tx/cdf4af976f6de29181321967ffda653402e72806da4b87e1bfe42c16096af459) |
| 17 | 2026-04-10 03:49 | `ca6c817535dadb14da02278480ba2558def0432fed4443a9b7d22685a725f43b` | [View ↗](https://stellar.expert/explorer/testnet/tx/ca6c817535dadb14da02278480ba2558def0432fed4443a9b7d22685a725f43b) |
| 18 | 2026-04-10 03:50 | `ed0a884f02fef292ff6361dc110afb1c7feff0844a9c1a834d4a371cdc5e000e` | [View ↗](https://stellar.expert/explorer/testnet/tx/ed0a884f02fef292ff6361dc110afb1c7feff0844a9c1a834d4a371cdc5e000e) |
| 19 | 2026-04-10 03:51 | `dcedd700974d04391f10222378eac12da1585cd68eb2b97d08fcb673b1a96061` | [View ↗](https://stellar.expert/explorer/testnet/tx/dcedd700974d04391f10222378eac12da1585cd68eb2b97d08fcb673b1a96061) |
| 20 | 2026-04-10 03:51 | `cc647098ad4b89b43817872f101f68f060ecfa53697b5be3f8f0e6c39abd7106` | [View ↗](https://stellar.expert/explorer/testnet/tx/cc647098ad4b89b43817872f101f68f060ecfa53697b5be3f8f0e6c39abd7106) |
| 21 | 2026-04-10 03:52 | `11a2696250afe08319f2f39a1d5f09bd6e894e123f3c2a0d9fe90848fe7a6416` | [View ↗](https://stellar.expert/explorer/testnet/tx/11a2696250afe08319f2f39a1d5f09bd6e894e123f3c2a0d9fe90848fe7a6416) |
| 22 | 2026-04-10 03:53 | `3d90091ca814ffc4f4a6792bb5122dab39e9094e464633625afdecc44743b3d4` | [View ↗](https://stellar.expert/explorer/testnet/tx/3d90091ca814ffc4f4a6792bb5122dab39e9094e464633625afdecc44743b3d4) |
| 23 | 2026-04-10 03:53 | `7fd737f5571d598621a47ac45dcdf2ca3c9fcc11b6c5498557102183d325030b` | [View ↗](https://stellar.expert/explorer/testnet/tx/7fd737f5571d598621a47ac45dcdf2ca3c9fcc11b6c5498557102183d325030b) |

## Real output — Successful cycle with LLM reasoning

```
[2026-04-10T05:29:32Z] [AGENT] Consumer Agent iniciado
[2026-04-10T05:29:32Z] [AGENT] Wallet   : GDYJ5LX3Q5LVSZ3GXWIGEZP22VPRXEK4IWJGJVDF5M6WJIEHF3ZK4NDS
[2026-04-10T05:29:32Z] [AGENT] API URL  : http://localhost:8080
[2026-04-10T05:29:32Z] [AGENT] Pair     : BTC-USDC
[2026-04-10T05:29:32Z] [AGENT] Price    : 0.10 XLM / señal
[2026-04-10T05:29:32Z] [AGENT] Interval : 30s entre ciclos
[2026-04-10T05:29:32Z] [AGENT] LLM      : Groq llama-3.1-8b-instant
[2026-04-10T05:29:33Z] [AGENT] Balance  : 9967.5967600 XLM
[2026-04-10T05:29:33Z] [CYCLE] ─── Ciclo 1 ─────────────────────────────────────
[2026-04-10T05:29:33Z] [REQUEST] GET /signal?pair=BTC-USDC
[2026-04-10T05:29:33Z] [402] Payment required: 0.10 XLM → GBZWI25V...2XVN
[2026-04-10T05:29:33Z] [402] Memo: signal-btc-usdc
[2026-04-10T05:29:33Z] [PAYMENT] Enviando tx de 0.10 XLM...
[2026-04-10T05:29:39Z] [PAYMENT] TX enviada   : 5441374f34dc3b58d6c4bd0afa1d0d7e3d1f26232ec269890f5518b228d70b94
[2026-04-10T05:29:39Z] [PAYMENT] Explorer     : https://stellar.expert/explorer/testnet/tx/5441374f34dc3b58d6c4bd0afa1d0d7e3d1f26232ec269890f5518b228d70b94
[2026-04-10T05:29:39Z] [PAYMENT] Esperando confirmación en Horizon (~5s en testnet)...
[2026-04-10T05:29:40Z] [PAYMENT] TX confirmada: 5441374f34dc3b58d6c4bd0afa1d0d7e3d1f26232ec269890f5518b228d70b94
[2026-04-10T05:29:40Z] [REQUEST] Reintentando con X-Payment: 5441374f34dc3b58d6c4bd0afa1d0d7e3d1f26232ec269890f5518b228d70b94
[2026-04-10T05:29:40Z] [SIGNAL] BUY | confidence: 0.50 | BTC-USDC
[2026-04-10T05:29:40Z] [SIGNAL] Reasoning : Volumen bajo, esperar confirmación antes de entrar
[2026-04-10T05:29:41Z] [GROQ] "La confianza es baja y el analista sugiere esperar confirmación antes de entrar, lo que indica que no es un momento óptimo para ejecutar la operación."
[2026-04-10T05:29:41Z] [DECISION] execute: false
[2026-04-10T05:29:42Z] [AGENT] Balance actualizado: 9967.4967500 XLM
[2026-04-10T05:29:42Z] [AGENT] Próximo ciclo en 30s — Ctrl+C para detener
```

## Tech stack

| Component | Technology |
|-----------|-----------|
| Signal API | Go + `net/http` (production) |
| Signal API (alt) | TypeScript + Express + `@x402/express` + `@x402/stellar` |
| Consumer Agent | Python + `stellar-sdk` + `openai` (Groq-compatible) |
| Decision LLM | Groq `llama-3.1-8b-instant` (OpenAI-compatible API) |
| Signal generation | Mock with Claude fallback (`claude-sonnet-4-20250514`) |
| Payment layer | Stellar Testnet (XLM native) |
| Verification | Horizon REST API (`/transactions/<hash>/payments`) |
| Protocol | x402 (HTTP 402 Payment Required) |

## How it works

### x402 flow (step by step)

1. Consumer sends `GET /signal?pair=BTC-USDC` — no payment header
2. Server responds `402 Payment Required` with `{amount, destination, memo, asset}`
3. Consumer builds, signs, and submits a Stellar transaction (memo: `signal-btc-usdc`)
4. Consumer polls Horizon until TX is confirmed (~1–5s on testnet)
5. Consumer retries with header `X-Payment: <tx_hash>`
6. Server verifies on Horizon: destination ✓ · amount ≥ 0.10 XLM ✓ · memo ✓ · successful ✓
7. Server returns `{signal, confidence, reasoning}` JSON
8. Consumer passes signal to Groq → LLM decides `{execute: bool, reasoning}`
9. Loop repeats every 30 seconds

### Server-side verification (Go)

```go
// Per-request checks on X-Payment header:
// 1. TX exists on Horizon and is marked successful
// 2. tx.memo == "signal-<pair>" (e.g. "signal-btc-usdc")
// 3. payment.to == SERVER_PUBLIC_KEY
// 4. payment.amount >= SIGNAL_PRICE_XLM (0.10)
// 5. payment.asset_type == "native" (XLM)
```

## Project structure

```
Pantheon/
├── .env.example            # Required environment variables template
├── Makefile                # make setup | start | stop | demo | logs
├── docker-compose.yml      # Orchestrates both services (shared network + healthcheck)
├── signal-api/             # Signal API — Go (primary, always works)
│   ├── main.go             # HTTP server + x402 middleware + Claude fallback
│   ├── go.mod
│   └── go.sum
├── signal-api-ts/          # Signal API — TypeScript (x402-stellar packages)
│   ├── Dockerfile          # Node 20 Alpine, 3-stage multi-stage build
│   ├── src/index.ts        # Express + @x402/express + @x402/stellar
│   ├── package.json
│   └── tsconfig.json
├── consumer-agent/         # Consumer Agent — Python
│   ├── Dockerfile          # Python 3.11 slim
│   ├── agent.py            # Main loop: cycles every 30s, Groq decision
│   ├── wallet.py           # Stellar SDK: send payment, confirm, retry on bad_seq
│   ├── x402_client.py      # Handles 402 → pay → retry handshake
│   └── requirements.txt
└── scripts/
    ├── setup.sh            # Validate Docker, .env, required vars, Stellar balances
    ├── start.sh            # docker-compose up --build
    ├── stop.sh             # docker-compose down
    └── demo.sh             # Local x402 demo cycle with coloured output
```

## Setup

### Option A — Docker (recommended)

```bash
git clone https://github.com/DarienPerezGit/Pantheon.git
cd Pantheon
cp .env.example .env
# Fill in GROQ_API_KEY, SERVER_SECRET_KEY, CONSUMER_SECRET_KEY

make setup   # validates Docker, .env, and Stellar wallet balances
make start   # builds images and starts both services
make logs    # stream live logs from both containers
make stop    # tear everything down
```

The consumer-agent container waits for the signal-api healthcheck to pass before starting. Both services share an internal `pantheon-net` Docker network; the agent reaches the server at `http://signal-api:8080`.

### Option B — Local (no Docker)

#### Prerequisites
- Go 1.22+  /  Node.js 20+
- Python 3.10+
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Two funded Stellar testnet wallets

#### 1. Clone and configure

```bash
git clone https://github.com/DarienPerezGit/Pantheon.git
cd Pantheon
cp .env.example .env
# Fill in GROQ_API_KEY, SERVER_SECRET_KEY, CONSUMER_SECRET_KEY
```

#### 2. Fund wallets with Friendbot

```bash
curl "https://friendbot.stellar.org/?addr=YOUR_SERVER_PUBLIC_KEY"
curl "https://friendbot.stellar.org/?addr=YOUR_CONSUMER_PUBLIC_KEY"
```

#### 3. Start the Signal API (Go)

```bash
cd signal-api
go mod download
go run .
# → [START] Signal API listening on :8080
```

#### 4. Run the Consumer Agent

```bash
cd consumer-agent
pip install -r requirements.txt
python agent.py BTC-USDC
```

#### 5. Run a demo cycle

```bash
make demo   # or: bash scripts/demo.sh BTC-USDC
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `SERVER_PUBLIC_KEY` | Stellar public key of the Signal API wallet |
| `SERVER_SECRET_KEY` | Stellar secret key of the Signal API wallet |
| `CONSUMER_PUBLIC_KEY` | Stellar public key of the consumer agent wallet |
| `CONSUMER_SECRET_KEY` | Stellar secret key of the consumer agent wallet |
| `GROQ_API_KEY` | Groq API key — free at [console.groq.com](https://console.groq.com) |
| `ANTHROPIC_API_KEY` | Optional — enables Claude signal generation in Go server |
| `HORIZON_URL` | Horizon endpoint (default: testnet) |
| `SIGNAL_PRICE_XLM` | Price per signal in XLM (default: 0.10) |
| `SIGNAL_API_URL` | URL of the Signal API (default: http://localhost:8080) |

## Hackathon

- **Event:** Stellar Hacks: Agents
- **Track:** Agentic payments / x402
- **Network:** Stellar Testnet
- **Deadline:** April 13, 2026
- **Repo:** [github.com/DarienPerezGit/Pantheon](https://github.com/DarienPerezGit/Pantheon)

## Project structure

```
signal-agent-marketplace/
├── .env.example          # Required environment variables
├── signal-api/
│   ├── main.go           # HTTP server + x402 middleware + Claude signal generator
│   ├── go.mod
│   └── go.sum
└── consumer-agent/
    ├── agent.py          # Main loop: cycles every 30s, Claude decision
    ├── wallet.py         # Stellar SDK: send payment, wait for confirmation
    ├── x402_client.py    # Handles 402 → pay → retry handshake
    └── requirements.txt
```

## Setup

### Prerequisites
- Go 1.22+
- Python 3.10+
- Two funded Stellar testnet wallets

### 1. Clone and configure

```bash
git clone https://github.com/DarienPerezGit/Pantheon.git
cd Pantheon
cp .env.example .env
# Fill in your keys in .env
```

### 2. Fund wallets with Friendbot

```bash
curl "https://friendbot.stellar.org/?addr=YOUR_SERVER_PUBLIC_KEY"
curl "https://friendbot.stellar.org/?addr=YOUR_CONSUMER_PUBLIC_KEY"
```

### 3. Start the Signal API

```bash
cd signal-api
go mod download
go run .
# → [START] Signal API listening on :8080
```

### 4. Run the Consumer Agent

```bash
cd consumer-agent
pip install -r requirements.txt
python agent.py BTC-USDC
```

### Expected output

```
[AGENT]   Consumer Agent iniciado
[AGENT]   Balance: 10000.0000000 XLM
[CYCLE]   ─── Ciclo 1 ─────────────────────────────────────
[REQUEST] GET /signal?pair=BTC-USDC
[402]     Payment required: 0.10 XLM → GABCD...
[PAYMENT] Enviando tx de 0.10 XLM...
[PAYMENT] TX enviada   : abc123...
[PAYMENT] TX confirmada: abc123...
[REQUEST] Reintentando con X-Payment: abc123...
[SIGNAL]  BUY | confidence: 0.73 | BTC-USDC
[CLAUDE]  "RSI oversold + momentum positivo. Ejecutando."
[DECISION] execute: true
[AGENT]   Próximo ciclo en 30s — Ctrl+C para detener
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `SERVER_PUBLIC_KEY` | Stellar public key of the Signal API wallet |
| `SERVER_SECRET_KEY` | Stellar secret key of the Signal API wallet |
| `CONSUMER_PUBLIC_KEY` | Stellar public key of the consumer agent wallet |
| `CONSUMER_SECRET_KEY` | Stellar secret key of the consumer agent wallet |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude signal generation |
| `HORIZON_URL` | Horizon endpoint (default: testnet) |
| `SIGNAL_PRICE_XLM` | Price per signal in XLM (default: 0.10) |
| `SIGNAL_API_URL` | URL of the Signal API (default: http://localhost:8080) |

## Hackathon

- **Event:** Stellar Hacks: Agents
- **Track:** Agentic / x402 payments
- **Network:** Stellar Testnet
- **Deadline:** April 13, 2026
