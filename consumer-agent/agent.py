"""
agent.py — Consumer Agent main entry point.

Requests a trading signal from the Signal API, handles the x402 payment
handshake automatically, consults Claude for the execution decision, and
loops continuously every CYCLE_INTERVAL seconds.

Usage:
    python agent.py [PAIR]
    python agent.py BTC-USDC
"""

from pathlib import Path
from dotenv import load_dotenv

# Load .env from repo root (two levels up: consumer-agent/ -> Pantheon/)
load_dotenv(Path(__file__).parent.parent / ".env")

import json
import os
import sys
import time

from openai import OpenAI  # noqa: F401

from wallet import (
    send_payment,
    wait_for_confirmation,
    get_balance,           # XLM nativo — para verificar que haya gas
    get_usdc_balance,      # [MIGRATION] USDC — balance del activo de pago
    ensure_trustline,      # [MIGRATION] Garantiza trustline USDC antes de pagar
    CONSUMER_PUBLIC_KEY,
)
from x402_client import get_signal, log

# --- Config ---

SIGNAL_API_URL = os.getenv("SIGNAL_API_URL", "http://localhost:8080")
# [MIGRATION] La variable de entorno se llama SIGNAL_PRICE_XLM por retrocompat.,
# pero el precio ahora se denomina en USDC.
SIGNAL_PRICE_USDC = os.getenv("SIGNAL_PRICE_USDC", "0.10")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

_groq_client = None
if GROQ_API_KEY:
    _groq_client = OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
    )

DEFAULT_PAIR = "BTC-USDC"
CYCLE_INTERVAL = 30  # seconds between cycles


# --- Groq decision ---

def llm_decide(signal: dict, balance: float) -> dict:
    """
    Ask Groq (llama-3.1-8b-instant) whether to execute the trade signal.

    Returns dict with keys: execute (bool), reasoning (str).
    Falls back to a simple rule-based decision if the API key is unavailable.
    """
    if not GROQ_API_KEY or _groq_client is None:
        log("LLM", "No GROQ_API_KEY — using rule-based decision")
        execute = signal.get("confidence", 0) >= 0.65 and signal.get("signal") != "HOLD"
        return {"execute": execute, "reasoning": "Rule-based: confidence threshold 0.65"}

    prompt = (
        # [MIGRATION] balance ahora es USDC, no XLM
        f"Sos un trading agent autónomo con {balance:.2f} USDC en tu wallet. "
        f"Recibiste la siguiente señal de mercado:\n"
        f"  Par: {signal.get('pair')}\n"
        f"  Señal: {signal.get('signal')}\n"
        f"  Confidence: {signal.get('confidence', 0):.2f}\n"
        f"  Razonamiento del analista: {signal.get('reasoning')}\n\n"
        f"¿Ejecutás esta operación? "
        f"Respondé SOLO con JSON válido sin markdown: "
        f'{{"execute": true|false, "reasoning": "una oración concisa"}}'
    )

    completion = _groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=128,
        temperature=0.2,
    )
    text = completion.choices[0].message.content.strip()

    # Strip markdown code fences if model adds them
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:])
        text = text.rstrip("`").strip()

    return json.loads(text)


# --- Single cycle ---

def run_cycle(pair: str, cycle: int, balance: float) -> float:
    """
    Execute one signal-request -> pay -> decide cycle.
    Returns updated balance.
    """
    log("CYCLE", f"--- Ciclo {cycle} ---")

    # x402 flow (unchanged)
    try:
        signal = get_signal(
            base_url=SIGNAL_API_URL,
            pair=pair,
            wallet_send_fn=send_payment,
            wait_fn=wait_for_confirmation,
        )
    except RuntimeError as exc:
        log("ERROR", f"Ciclo {cycle} fallido: {exc}")
        return balance

    # Log signal
    action = signal.get("signal", "HOLD")
    confidence = signal.get("confidence", 0.0)
    reasoning = signal.get("reasoning", "")
    log("SIGNAL", f"{action} | confidence: {confidence:.2f} | {pair}")
    log("SIGNAL", f"Reasoning : {reasoning}")

    # LLM decision (Groq — llama-3.1-8b-instant)
    try:
        decision = llm_decide(signal, balance)
        execute = decision.get("execute", False)
        llm_reasoning = decision.get("reasoning", "")
        log("GROQ", f'"{llm_reasoning}"')
        log("DECISION", f"execute: {str(execute).lower()}")
    except Exception as exc:
        log("GROQ", f"Error consultando Groq: {exc} — defaulting to no-execute")
        execute = False

    # [MIGRATION] Refresh USDC balance (el activo de pago)
    try:
        balance = get_usdc_balance()
        log("AGENT", f"Balance actualizado: {balance:.7f} USDC")
    except Exception:
        pass  # non-fatal

    return balance


# --- Main loop ---

def main() -> None:
    pair = sys.argv[1].upper() if len(sys.argv) > 1 else DEFAULT_PAIR

    log("AGENT", "Consumer Agent iniciado")
    log("AGENT", f"Wallet   : {CONSUMER_PUBLIC_KEY}")
    log("AGENT", f"API URL  : {SIGNAL_API_URL}")
    log("AGENT", f"Pair     : {pair}")
    log("AGENT", f"Price    : {SIGNAL_PRICE_USDC} USDC / señal")  # [MIGRATION]
    log("AGENT", f"Interval : {CYCLE_INTERVAL}s entre ciclos")
    if GROQ_API_KEY:
        log("AGENT", "LLM      : Groq llama-3.1-8b-instant")
    else:
        log("AGENT", "LLM      : deshabilitado (rule-based decisions)")

    # [MIGRATION] Paso 0: garantizar trustline USDC antes de cualquier pago.
    # Sin esta operación Horizon rechaza el pago con op_no_trust.
    try:
        ensure_trustline()
    except RuntimeError as exc:
        log("ERROR", f"No se pudo establecer trustline USDC: {exc}")
        log("ERROR", "Abortando — sin trustline el agente no puede pagar.")
        sys.exit(1)

    # Mostrar balances iniciales (XLM para gas, USDC para pagos)
    balance = 0.0
    try:
        xlm_balance = get_balance()
        balance = get_usdc_balance()  # [MIGRATION] activo de pago
        log("AGENT", f"Balance XLM  : {xlm_balance:.7f} (gas fees)")
        log("AGENT", f"Balance USDC : {balance:.7f} (activo de pago)")  # [MIGRATION]
        if balance < float(SIGNAL_PRICE_USDC):
            log("WARN", "Balance USDC puede ser insuficiente para el primer pago")
        if xlm_balance < 0.01:
            log("WARN", "Balance XLM muy bajo — puede no alcanzar para las fees")
    except Exception as exc:
        log("WARN", f"No se pudo obtener balance: {exc}")

    cycle = 1
    try:
        while True:
            balance = run_cycle(pair, cycle, balance)
            cycle += 1
            log("AGENT", f"Próximo ciclo en {CYCLE_INTERVAL}s — Ctrl+C para detener")
            time.sleep(CYCLE_INTERVAL)
    except KeyboardInterrupt:
        log("AGENT", f"Agente detenido por el usuario tras {cycle - 1} ciclo(s).")


if __name__ == "__main__":
    main()
