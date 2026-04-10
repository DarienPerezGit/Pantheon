# Signal Agent Marketplace

> **Stellar Hacks: Agents — Hackathon submission**
> An autonomous trading agent that pays micropayments on Stellar to purchase trading signals — machine-to-machine, no human required.

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

All transactions are publicly verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet):

| Day | Cycle | TX Hash | Explorer |
|-----|-------|---------|----------|
| 1 | smoke test | `3b8d6df58b5a3b742669da8d624b7b08262b338e2924f7650f9ff546db5df377` | [View ↗](https://stellar.expert/explorer/testnet/tx/3b8d6df58b5a3b742669da8d624b7b08262b338e2924f7650f9ff546db5df377) |
| 2 | 1 | `8da141197bd0d38405f06b130f19417494e6eb7b255533a34536c901c0a44443` | [View ↗](https://stellar.expert/explorer/testnet/tx/8da141197bd0d38405f06b130f19417494e6eb7b255533a34536c901c0a44443) |
| 2 | 2 | `378a2acc6484391776612933c60d27677a3be6cacffcd2dca76fb0ac57387781` | [View ↗](https://stellar.expert/explorer/testnet/tx/378a2acc6484391776612933c60d27677a3be6cacffcd2dca76fb0ac57387781) |
| 2 | 3 | `fb029dce79a09c2a6751fbb4bc84edc207ece742a590cf45fb8597da73a0b6ae` | [View ↗](https://stellar.expert/explorer/testnet/tx/fb029dce79a09c2a6751fbb4bc84edc207ece742a590cf45fb8597da73a0b6ae) |
| 3 | 1 | `e4664e027b55bfee9c2e5be50234ed51bcc39bc25ad584d013621f3fdc3c5844` | [View ↗](https://stellar.expert/explorer/testnet/tx/e4664e027b55bfee9c2e5be50234ed51bcc39bc25ad584d013621f3fdc3c5844) |
| 3 | 2 | `9541c522b8d5a6dccad7975634bfb15b3879dcd671b736d6c95ec341b1d76463` | [View ↗](https://stellar.expert/explorer/testnet/tx/9541c522b8d5a6dccad7975634bfb15b3879dcd671b736d6c95ec341b1d76463) |

**Consumer wallet:** `GDYJ5LX3Q5LVSZ3GXWIGEZP22VPRXEK4IWJGJVDF5M6WJIEHF3ZK4NDS`
**Server wallet:** `GBZWI25VLQRRNZOZAPPYLSGME5HPLAWYN3BUE3ZPRHBZSNGIS4U62XVN`

## Real output — Successful cycle with LLM reasoning

```
[2026-04-10T04:41:58Z] [AGENT] Consumer Agent iniciado
[2026-04-10T04:41:58Z] [AGENT] Wallet   : GDYJ5LX3Q5LVSZ3GXWIGEZP22VPRXEK4IWJGJVDF5M6WJIEHF3ZK4NDS
[2026-04-10T04:41:58Z] [AGENT] LLM      : Groq llama-3.1-8b-instant
[2026-04-10T04:41:59Z] [AGENT] Balance  : 9985.9986000 XLM
[2026-04-10T04:41:59Z] [CYCLE] ─── Ciclo 1 ─────────────────────────────────────
[2026-04-10T04:41:59Z] [REQUEST] GET /signal?pair=BTC-USDC
[2026-04-10T04:41:59Z] [402] Payment required: 0.10 XLM → GBZWI25V...2XVN
[2026-04-10T04:41:59Z] [402] Memo: signal-btc-usdc
[2026-04-10T04:41:59Z] [PAYMENT] Enviando tx de 0.10 XLM...
[2026-04-10T04:42:05Z] [PAYMENT] TX enviada   : e4664e027b55bfee9c2e5be50234ed51bcc39bc25ad584d013621f3fdc3c5844
[2026-04-10T04:42:05Z] [PAYMENT] Explorer     : https://stellar.expert/explorer/testnet/tx/e4664e027b55bfee9c2e5be50234ed51bcc39bc25ad584d013621f3fdc3c5844
[2026-04-10T04:42:05Z] [PAYMENT] Esperando confirmación en Horizon (~5s en testnet)...
[2026-04-10T04:42:06Z] [PAYMENT] TX confirmada: e4664e027b55bfee9c2e5be50234ed51bcc39bc25ad584d013621f3fdc3c5844
[2026-04-10T04:42:06Z] [REQUEST] Reintentando con X-Payment: e4664e027b55bfee9c2e5be50234ed51bcc39bc25ad584d013621f3fdc3c5844
[2026-04-10T04:42:06Z] [SIGNAL] SELL | confidence: 0.75 | BTC-USDC
[2026-04-10T04:42:06Z] [SIGNAL] Reasoning : Breakout confirmado sobre resistencia clave
[2026-04-10T04:42:07Z] [GROQ] "La confianza de la señal es baja (0.75) y no tengo suficiente información sobre el contexto del mercado para tomar una decisión informada."
[2026-04-10T04:42:07Z] [DECISION] execute: false
[2026-04-10T04:42:08Z] [AGENT] Balance actualizado: 9985.8985900 XLM
[2026-04-10T04:42:08Z] [AGENT] Próximo ciclo en 30s — Ctrl+C para detener
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
signal-agent-marketplace/
├── .env.example            # Required environment variables
├── signal-api/             # Signal API — Go (primary)
│   ├── main.go             # HTTP server + x402 middleware + Claude fallback
│   ├── go.mod
│   └── go.sum
├── signal-api-ts/          # Signal API — TypeScript (x402-stellar packages)
│   ├── src/index.ts        # Express + @x402/express + @x402/stellar
│   ├── package.json
│   └── tsconfig.json
└── consumer-agent/         # Consumer Agent — Python
    ├── agent.py            # Main loop: cycles every 30s, Groq decision
    ├── wallet.py           # Stellar SDK: send payment, confirm, retry on bad_seq
    ├── x402_client.py      # Handles 402 → pay → retry handshake
    └── requirements.txt
```

## Setup

### Prerequisites
- Go 1.22+  /  Node.js 20+
- Python 3.10+
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Two funded Stellar testnet wallets

### 1. Clone and configure

```bash
git clone https://github.com/DarienPerezGit/Pantheon.git
cd Pantheon
cp .env.example .env
# Fill in GROQ_API_KEY, SERVER_SECRET_KEY, CONSUMER_SECRET_KEY
```

### 2. Fund wallets with Friendbot

```bash
curl "https://friendbot.stellar.org/?addr=YOUR_SERVER_PUBLIC_KEY"
curl "https://friendbot.stellar.org/?addr=YOUR_CONSUMER_PUBLIC_KEY"
```

### 3. Start the Signal API (Go)

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


---

## What it does

Signal Agent Marketplace implements the **x402 protocol** on Stellar: a consumer agent autonomously decides when to buy a trading signal, pays 0.10 XLM to a signal provider API, and receives a Claude-generated analysis to act on — all in a continuous loop.

```
Consumer Agent  ──GET /signal──▶  Signal API
                ◀──── 402 ──────  (payment instructions)
                ──pay 0.10 XLM──▶  Stellar Testnet
                ──GET /signal──▶  (X-Payment: <tx_hash>)
                ◀── BUY/SELL ───  Claude-generated signal
```

## Problem solved

**Agents can't pay.** The x402 protocol fixes this: HTTP 402 becomes a native monetization layer for machine-to-machine transactions. Stellar is ideal — 5-second finality, sub-cent fees, no smart contracts required.

## Live demo transactions (Stellar testnet)

| Cycle | TX Hash | Explorer |
|-------|---------|----------|
| 1 | `3b8d6df5...df377` | [View](https://stellar.expert/explorer/testnet/tx/3b8d6df58b5a3b742669da8d624b7b08262b338e2924f7650f9ff546db5df377) |
| 2 | `8da14119...4443` | [View](https://stellar.expert/explorer/testnet/tx/8da141197bd0d38405f06b130f19417494e6eb7b255533a34536c901c0a44443) |
| 3 | `378a2acc...7781` | [View](https://stellar.expert/explorer/testnet/tx/378a2acc6484391776612933c60d27677a3be6cacffcd2dca76fb0ac57387781) |

## Tech stack

| Component | Technology |
|-----------|-----------|
| Signal API | Go + `net/http` + Anthropic API |
| Consumer Agent | Python + `stellar-sdk` + Anthropic API |
| Payment layer | Stellar Testnet (XLM native) |
| Verification | Horizon REST API |
| Signal generation | Claude (`claude-sonnet-4-20250514`) |
| Protocol | x402 (HTTP 402 Payment Required) |

## How it works

### x402 flow

1. Consumer sends `GET /signal?pair=BTC-USDC` with no payment header
2. Signal API responds `402 Payment Required` with `{amount, destination, memo}`
3. Consumer builds, signs and submits a Stellar transaction
4. Consumer polls Horizon until the TX is confirmed (~5s)
5. Consumer retries with `X-Payment: <tx_hash>` header
6. Signal API verifies the TX on Horizon (destination ✓, amount ≥ 0.10 XLM ✓, memo ✓)
7. Signal API calls Claude with mock market data → returns `{signal, confidence, reasoning}`
8. Consumer passes signal to Claude → decides `{execute: bool, reasoning}`
9. Loop repeats every 30 seconds

### Verification (server-side, Go)

```go
// Checks performed on every X-Payment header:
// 1. TX exists and is successful on Horizon
// 2. Memo == "signal-<pair>" (e.g. "signal-btc-usdc")
// 3. Payment destination == SERVER_PUBLIC_KEY
// 4. Payment amount >= SIGNAL_PRICE_XLM (0.10)
// 5. Asset type == native XLM
```

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
