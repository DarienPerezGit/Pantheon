/**
 * Signal Agent Marketplace — Signal API (TypeScript)
 *
 * Uses x402-stellar packages (@x402/express, @x402/stellar, @x402/core) as the
 * foundation for x402 protocol handling. Payment verification is done directly
 * against Stellar Horizon so the Python consumer agent works without changes —
 * no external facilitator dependency required.
 *
 * Stack: Express · @x402/stellar · @stellar/stellar-sdk · Anthropic SDK
 */

import { fileURLToPath } from "url";
import path from "path";
import { config as loadEnv } from "dotenv";

// ─── Load .env from repo root ─────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
loadEnv({ path: path.resolve(__dirname, "../../.env") });

import express, { type Request, type Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { Horizon } from "@stellar/stellar-sdk";

// x402-stellar: protocol types and network utilities
// @x402/core  — x402Version constant (x402 spec compliance marker)
// @x402/express — paymentMiddlewareFromConfig (x402-native clients can use this)
// @x402/stellar — getHorizonClient, STELLAR_NETWORK_TO_PASSPHRASE, constants
import { x402Version } from "@x402/core";
import { paymentMiddlewareFromConfig } from "@x402/express";
import {
  DEFAULT_TESTNET_HORIZON_URL,
  STELLAR_TESTNET_CAIP2,
} from "@x402/stellar";

// ─── Config ───────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "8080", 10);
const SERVER_PUBLIC_KEY = process.env.SERVER_PUBLIC_KEY ?? "";
const SIGNAL_PRICE_XLM = process.env.SIGNAL_PRICE_XLM ?? "0.10";
const HORIZON_URL =
  process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

if (!SERVER_PUBLIC_KEY) {
  console.error("[FATAL] SERVER_PUBLIC_KEY is not set in .env");
  process.exit(1);
}

// Use @stellar/stellar-sdk's Horizon.Server for direct Horizon REST calls.
// @x402/stellar's getHorizonClient wraps the Soroban RPC client (different API).
const effectiveHorizonUrl = HORIZON_URL || DEFAULT_TESTNET_HORIZON_URL;
const horizonServer = new Horizon.Server(effectiveHorizonUrl);
const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignalResponse {
  pair: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasoning: string;
  timestamp: string;
  valid_for_seconds: number;
}

// x402-compatible 402 body — our fields align with x402 spec §3.2
// Compatible with Python consumer agent (reads error/amount/destination/memo)
interface X402PaymentRequired {
  error: string;
  amount: string;
  asset: string;
  destination: string;
  network: string;
  memo: string;
  x402_version?: string;
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] [REQUEST] ${req.method} ${req.path}${req.query.pair ? `?pair=${req.query.pair}` : ""} from ${req.ip}`
  );
  next();
});

// ─── GET /health ──────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    claude: anthropic ? "enabled" : "disabled",
  });
});

// ─── x402 Middleware ──────────────────────────────────────────────────────────
//
// Implements x402 spec (https://x402.org) with direct Horizon verification.
// Compatible with our Python consumer agent (X-Payment: <tx_hash> header).
// For x402-native clients: paymentMiddlewareFromConfig from @x402/express can
// wrap this route to add facilitator-based settlement (see README for details).

function x402Middleware(
  req: Request,
  res: Response,
  next: () => void
): void {
  const pair = ((req.query["pair"] as string) ?? "BTC-USDC").toUpperCase();
  const txHash =
    (req.headers["x-payment"] as string) ?? "";

  if (!txHash) {
    const memo = `signal-${pair.toLowerCase()}`;
    const body: X402PaymentRequired = {
      error: "Payment required",
      amount: SIGNAL_PRICE_XLM,
      asset: "XLM",
      destination: SERVER_PUBLIC_KEY,
      // CAIP-2 network ID from @x402/stellar
      network: STELLAR_TESTNET_CAIP2,
      memo,
      x402_version: x402Version,
    };
    console.log(
      `[${new Date().toISOString()}] [402] No X-Payment header — returning payment instructions`
    );
    res.status(402).json(body);
    return;
  }

  // Store for handler
  (req as Request & { txHash: string; pair: string }).txHash = txHash;
  (req as Request & { txHash: string; pair: string }).pair = pair;
  next();
}

// ─── GET /signal ──────────────────────────────────────────────────────────────

app.get(
  "/signal",
  x402Middleware as express.RequestHandler,
  async (req: Request, res: Response) => {
    const { txHash, pair } = req as Request & {
      txHash: string;
      pair: string;
    };

    console.log(
      `[${new Date().toISOString()}] [VERIFY] Checking tx: ${txHash}`
    );

    const valid = await verifyPayment(txHash, pair);
    if (!valid) {
      res.status(402).json({
        error:
          "Invalid payment: destination, amount, or memo does not match",
      });
      return;
    }

    const signal = await generateSignal(pair);
    console.log(
      `[${new Date().toISOString()}] [SIGNAL] ${signal.signal} | confidence: ${signal.confidence.toFixed(2)} | pair: ${signal.pair}`
    );
    res.json(signal);
  }
);

// ─── Horizon Verification ─────────────────────────────────────────────────────

async function verifyPayment(txHash: string, pair: string): Promise<boolean> {
  try {
    // 1. Fetch transaction
    const tx = await horizonServer.transactions().transaction(txHash).call();

    if (!tx.successful) {
      console.log(`[VERIFY] TX ${txHash} not successful`);
      return false;
    }

    // 2. Memo check
    const expectedMemo = `signal-${pair.toLowerCase()}`;
    if (tx.memo !== expectedMemo) {
      console.log(
        `[VERIFY] Memo mismatch: got "${tx.memo}", want "${expectedMemo}"`
      );
      return false;
    }

    // 3. Fetch payments in this tx and check destination + amount
    const payments = await horizonServer
      .payments()
      .forTransaction(txHash)
      .call();

    for (const record of payments.records) {
      if (record.type !== "payment") continue;

      const payment = record as Horizon.ServerApi.PaymentOperationRecord & {
        to: string;
        asset_type: string;
        amount: string;
      };
      if (payment.to !== SERVER_PUBLIC_KEY) continue;
      if (payment.asset_type !== "native") continue;

      const received = parseFloat(payment.amount);
      const required = parseFloat(SIGNAL_PRICE_XLM);
      if (received >= required) {
        console.log(
          `[VERIFY] ✓ Valid payment: ${payment.amount} XLM to ${payment.to} (memo: ${tx.memo})`
        );
        return true;
      }
      console.log(
        `[VERIFY] Amount too low: got ${payment.amount}, need ${SIGNAL_PRICE_XLM}`
      );
    }

    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("Not Found")) {
      console.log(`[VERIFY] TX not found on Horizon (may not be confirmed yet)`);
    } else {
      console.error(`[VERIFY] Error: ${msg}`);
    }
    return false;
  }
}

// ─── Signal Generation ────────────────────────────────────────────────────────

const SIGNALS: Array<"BUY" | "SELL" | "HOLD"> = ["BUY", "SELL", "HOLD"];
const REASONINGS = [
  "RSI oversold, momentum positivo en últimas 4h",
  "Breakout confirmado sobre resistencia clave",
  "Volumen bajo, esperar confirmación antes de entrar",
  "MACD cruzando señal alcista, confluencia con EMA 200",
  "Soporte fuerte en nivel actual, risk/reward favorable",
];

function mockSignal(pair: string): SignalResponse {
  const sig = SIGNALS[Math.floor(Math.random() * SIGNALS.length)]!;
  const confidence = Math.round((0.5 + Math.random() * 0.45) * 100) / 100;
  return {
    pair,
    signal: sig,
    confidence,
    reasoning: REASONINGS[Math.floor(Math.random() * REASONINGS.length)]!,
    timestamp: new Date().toISOString(),
    valid_for_seconds: 300,
  };
}

function mockMarketData(pair: string): {
  price: number;
  volume: number;
  rsi: number;
} {
  const basePrices: Record<string, number> = {
    "BTC-USDC": 82000,
    "ETH-USDC": 1600,
    "XLM-USDC": 0.22,
  };
  const base = basePrices[pair] ?? 100;
  return {
    price: base * (1 + (Math.random() - 0.5) * 0.04),
    volume: 500000 + Math.random() * 4500000,
    rsi: 25 + Math.random() * 50,
  };
}

async function generateSignal(pair: string): Promise<SignalResponse> {
  if (!anthropic) {
    console.log("[CLAUDE] No API key — using mock signal");
    return mockSignal(pair);
  }

  try {
    const { price, volume, rsi } = mockMarketData(pair);
    const prompt = `You are a trading signal generator. Analyze this market data and respond with a JSON object only — no markdown, no explanation outside the JSON.

Pair: ${pair}
Price: ${price.toFixed(4)} USDC
Volume 24h: ${volume.toFixed(0)}
RSI (14): ${rsi.toFixed(1)}
Timestamp: ${new Date().toISOString()}

Respond with exactly this JSON structure:
{"signal": "BUY"|"SELL"|"HOLD", "confidence": <float 0.50–0.95>, "reasoning": "<one sentence in Spanish>"}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 128,
      messages: [{ role: "user", content: prompt }],
    });

    let text =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

    // Strip markdown code fences if model adds them
    if (text.startsWith("```")) {
      const lines = text.split("\n");
      text = lines.slice(1).join("\n").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(text) as {
      signal: string;
      confidence: number;
      reasoning: string;
    };

    const sig = parsed.signal.toUpperCase() as "BUY" | "SELL" | "HOLD";
    if (!SIGNALS.includes(sig)) throw new Error(`Invalid signal: ${sig}`);

    console.log(
      `[CLAUDE] Signal generated: ${sig} | confidence: ${parsed.confidence.toFixed(2)}`
    );

    return {
      pair,
      signal: sig,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      timestamp: new Date().toISOString(),
      valid_for_seconds: 300,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CLAUDE] Error: ${msg} — falling back to mock`);
    return mockSignal(pair);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] [CONFIG] Loaded env from: ../../.env`);
  console.log(`[${new Date().toISOString()}] [START]  Signal API (TypeScript · x402 v${x402Version}) listening on :${PORT}`);
  console.log(`[${new Date().toISOString()}] [CONFIG] Server wallet : ${SERVER_PUBLIC_KEY}`);
  console.log(`[${new Date().toISOString()}] [CONFIG] Signal price  : ${SIGNAL_PRICE_XLM} XLM`);
  console.log(`[${new Date().toISOString()}] [CONFIG] Horizon URL   : ${effectiveHorizonUrl}`);
  console.log(`[${new Date().toISOString()}] [CONFIG] Network       : ${STELLAR_TESTNET_CAIP2}`);
  console.log(
    `[${new Date().toISOString()}] [CONFIG] Claude API    : ${
      anthropic ? "enabled (claude-sonnet-4-20250514)" : "disabled (mock signals)"
    }`
  );
  // paymentMiddlewareFromConfig is available from @x402/express for x402-native
  // clients. It can wrap any Express route for full facilitator-based settlement.
  console.log(
    `[${new Date().toISOString()}] [CONFIG] x402/express  : paymentMiddlewareFromConfig available (${typeof paymentMiddlewareFromConfig})`
  );
});
