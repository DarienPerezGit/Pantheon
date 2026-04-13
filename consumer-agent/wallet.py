"""
wallet.py — Stellar wallet operations for the Consumer Agent.

Loads credentials from .env at the repo root (two levels up from this file).

[MIGRATION] Asset: XLM (native) → USDC (Stellar Testnet)
  - USDC_ISSUER: Emisor oficial de USDC en Stellar Testnet.
  - ensure_trustline(): Garantiza que el consumer tenga trustline antes de pagar.
  - send_payment(): Ahora envía Asset("USDC", USDC_ISSUER) en lugar de Asset.native().
"""

from pathlib import Path
from dotenv import load_dotenv

# Resolve path to .env at repo root regardless of CWD
load_dotenv(Path(__file__).parent.parent / ".env")

import os
import time
import requests
from stellar_sdk import Keypair, Server, TransactionBuilder, Network, Asset, ChangeTrust

# --- Config from environment ---

HORIZON_URL = os.getenv("HORIZON_URL", "https://horizon-testnet.stellar.org")
CONSUMER_SECRET_KEY = os.getenv("CONSUMER_SECRET_KEY")
CONSUMER_PUBLIC_KEY = os.getenv("CONSUMER_PUBLIC_KEY")

if not CONSUMER_SECRET_KEY:
    raise EnvironmentError("CONSUMER_SECRET_KEY is not set in .env")
if not CONSUMER_PUBLIC_KEY:
    raise EnvironmentError("CONSUMER_PUBLIC_KEY is not set in .env")

# --- [MIGRATION] USDC Asset (Stellar Testnet) ---
# Emisor oficial de USDC en Stellar Testnet (Circle / Centre).
# Fuente: https://developers.stellar.org/docs/tokens/usdc
USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

# Objeto Asset que se reutiliza en send_payment() y ensure_trustline()
USDC_ASSET = Asset("USDC", USDC_ISSUER)


# --- Wallet helpers ---

def get_keypair() -> Keypair:
    return Keypair.from_secret(CONSUMER_SECRET_KEY)


def get_balance() -> float:
    """Return the native XLM balance for the consumer wallet (para gas fees)."""
    server = Server(HORIZON_URL)
    account = server.accounts().account_id(CONSUMER_PUBLIC_KEY).call()
    for balance in account["balances"]:
        if balance["asset_type"] == "native":
            return float(balance["balance"])
    return 0.0


def get_usdc_balance() -> float:
    """Return the USDC balance for the consumer wallet."""
    server = Server(HORIZON_URL)
    account = server.accounts().account_id(CONSUMER_PUBLIC_KEY).call()
    for balance in account["balances"]:
        # Los activos no-nativos tienen asset_code e asset_issuer
        if (
            balance.get("asset_code") == "USDC"
            and balance.get("asset_issuer") == USDC_ISSUER
        ):
            return float(balance["balance"])
    return 0.0


def ensure_trustline() -> bool:
    """
    [MIGRATION] Verifica si la wallet del Consumer tiene una Trustline activa
    para USDC. Si no existe, construye, firma y envía una operación ChangeTrust
    para habilitarla.

    Returns:
        True si la trustline ya existía o fue creada exitosamente.

    Raises:
        RuntimeError: Si la operación ChangeTrust falla en Horizon.
    """
    server = Server(HORIZON_URL)
    account = server.accounts().account_id(CONSUMER_PUBLIC_KEY).call()

    # Buscar si ya existe una trustline para USDC del emisor correcto
    for balance in account["balances"]:
        if (
            balance.get("asset_code") == "USDC"
            and balance.get("asset_issuer") == USDC_ISSUER
        ):
            print(f"[TRUSTLINE] OK USDC trustline already exists (balance: {balance['balance']})")
            return True

    # No existe — crearla con ChangeTrust
    print("[TRUSTLINE] USDC trustline not found. Submitting ChangeTrust...")
    keypair = get_keypair()
    source_account = server.load_account(keypair.public_key)

    transaction = (
        TransactionBuilder(
            source_account=source_account,
            network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
            base_fee=100,
        )
        .append_change_trust_op(
            asset=USDC_ASSET,  # Habilita recepción de USDC de este emisor
            # limit=None usa el límite máximo por defecto
        )
        .set_timeout(30)
        .build()
    )
    transaction.sign(keypair)

    try:
        response = server.submit_transaction(transaction)
        print(f"[TRUSTLINE] OK ChangeTrust submitted. TX hash: {response['hash']}")
        return True
    except Exception as exc:
        raise RuntimeError(f"ChangeTrust submission failed: {exc}") from exc


def send_payment(destination: str, amount: str, memo: str) -> str:
    """
    [MIGRATION] Envía un pago en USDC (en lugar de XLM nativo) desde la wallet
    del Consumer Agent.

    El activo utilizado es USDC_ASSET = Asset("USDC", USDC_ISSUER), que referencia
    al emisor de USDC en Stellar Testnet. La red (gas) sigue siendo XLM nativo.

    Args:
        destination: Stellar public key of the recipient.
        amount: Amount in USDC as a string (e.g. "0.10").
        memo: Text memo to attach (max 28 bytes for testnet).

    Returns:
        Transaction hash (str).

    Raises:
        RuntimeError: If the transaction fails to submit.
    """
    keypair = get_keypair()
    server = Server(HORIZON_URL)

    # Retry once on tx_bad_seq (stale sequence number from Horizon cache)
    for attempt in range(2):
        source_account = server.load_account(keypair.public_key)

        # Memo must be ≤ 28 bytes; truncate safely
        memo_text = memo[:28]

        transaction = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
                base_fee=100,
            )
            .add_text_memo(memo_text)
            .append_payment_op(
                destination=destination,
                # [MIGRATION] Antes: Asset.native() (XLM)
                # Ahora: USDC_ASSET — Asset("USDC", USDC_ISSUER)
                asset=USDC_ASSET,
                amount=str(amount),
            )
            .set_timeout(30)
            .build()
        )

        transaction.sign(keypair)

        try:
            response = server.submit_transaction(transaction)
            return response["hash"]
        except Exception as exc:
            err = str(exc)
            if "tx_bad_seq" in err and attempt == 0:
                time.sleep(2)  # brief pause, then reload account and retry
                continue
            raise RuntimeError(f"Transaction submission failed: {exc}") from exc

    raise RuntimeError("Transaction failed after sequence number retry")


def wait_for_confirmation(tx_hash: str, timeout: int = 45, poll_interval: int = 4) -> bool:
    """
    Poll Horizon until the transaction is confirmed or timeout is reached.

    Returns True if confirmed, False on timeout.
    """
    url = f"{HORIZON_URL}/transactions/{tx_hash}"
    deadline = time.time() + timeout

    while time.time() < deadline:
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("successful") is True:
                    return True
        except requests.RequestException:
            pass
        time.sleep(poll_interval)

    return False
