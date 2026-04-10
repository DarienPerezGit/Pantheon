# Signal Agent Marketplace

> **Stellar Hacks: Agents — Hackathon submission**
> An autonomous trading agent that pays micropayments on Stellar to purchase trading signals — machine-to-machine, no human required.

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
