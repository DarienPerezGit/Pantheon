"""
x402_client.py — HTTP client that handles the x402 Payment Required handshake.

Flow:
  1. GET /signal -> 402 with {amount, asset, destination, memo}
  2. Build + sign Stellar tx
  3. GET /signal + X-Payment: <tx_hash> -> 200 with signal
"""

import sys
import requests
from datetime import datetime, timezone


# --- Logging ---

def log(level: str, message: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] [{level}] {message}", flush=True)


# --- x402 Client ---

def get_signal(
    base_url: str,
    pair: str,
    wallet_send_fn,
    wait_fn,
) -> dict:
    """
    Request a trading signal, handling the x402 payment handshake automatically.

    Args:
        base_url:        Base URL of the Signal API (e.g. "http://localhost:8080").
        pair:            Trading pair (e.g. "BTC-USDC").
        wallet_send_fn:  Callable(destination, amount, memo) -> tx_hash (str).
        wait_fn:         Callable(tx_hash) -> bool (True = confirmed).

    Returns:
        Signal dict from the API.

    Raises:
        RuntimeError on unrecoverable errors.
    """
    url = f"{base_url}/signal"
    params = {"pair": pair}

    # --- Step 1: Initial request (no payment header) ---
    log("REQUEST", f"GET /signal?pair={pair}")

    try:
        resp = requests.get(url, params=params, timeout=15)
    except requests.RequestException as exc:
        raise RuntimeError(f"Network error reaching Signal API: {exc}") from exc

    if resp.status_code == 200:
        log("SIGNAL", "Signal received on first try (no payment needed)")
        return resp.json()

    if resp.status_code != 402:
        raise RuntimeError(
            f"Unexpected status {resp.status_code} from Signal API: {resp.text}"
        )

    # --- Step 2: Parse 402 instructions ---
    try:
        instructions = resp.json()
    except Exception as exc:
        raise RuntimeError(f"Could not parse 402 response body: {exc}") from exc

    amount = instructions.get("amount", "0.10")
    destination = instructions.get("destination")
    memo = instructions.get("memo", f"signal-{pair.lower()}")
    asset = instructions.get("asset", "XLM")

    if not destination:
        raise RuntimeError("402 response missing 'destination' field")

    log("402", f"Payment required: {amount} {asset} -> {destination[:8]}...{destination[-4:]}")
    log("402", f"Memo: {memo}")

    # --- Step 3: Send payment ---
    log("PAYMENT", f"Enviando tx de {amount} {asset}...")

    try:
        tx_hash = wallet_send_fn(destination, amount, memo)
    except Exception as exc:
        raise RuntimeError(f"Failed to send payment: {exc}") from exc

    log("PAYMENT", f"TX enviada   : {tx_hash}")
    log("PAYMENT", f"Explorer     : https://stellar.expert/explorer/testnet/tx/{tx_hash}")

    # --- Step 4: Wait for confirmation ---
    log("PAYMENT", "Esperando confirmación en Horizon (~5s en testnet)...")

    confirmed = wait_fn(tx_hash)
    if not confirmed:
        raise RuntimeError(
            f"Transaction {tx_hash} was not confirmed within the timeout. "
            "Check manually: https://stellar.expert/explorer/testnet/tx/{tx_hash}"
        )

    log("PAYMENT", f"TX confirmada: {tx_hash}")

    # --- Step 5: Retry with X-Payment header ---
    log("REQUEST", f"Reintentando con X-Payment: {tx_hash}")

    try:
        resp2 = requests.get(
            url,
            params=params,
            headers={"X-Payment": tx_hash},
            timeout=15,
        )
    except requests.RequestException as exc:
        raise RuntimeError(f"Network error on payment retry: {exc}") from exc

    if resp2.status_code == 200:
        return resp2.json()

    raise RuntimeError(
        f"Signal API rejected payment (HTTP {resp2.status_code}): {resp2.text}"
    )
