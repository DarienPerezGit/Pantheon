"""
wallet.py — Stellar wallet operations for the Consumer Agent.

Loads credentials from .env at the repo root (two levels up from this file).
"""

from pathlib import Path
from dotenv import load_dotenv

# Resolve path to .env at repo root regardless of CWD
load_dotenv(Path(__file__).parent.parent / ".env")

import os
import time
import requests
from stellar_sdk import Keypair, Server, TransactionBuilder, Network, Asset

# ─── Config from environment ───────────────────────────────────────────────────

HORIZON_URL = os.getenv("HORIZON_URL", "https://horizon-testnet.stellar.org")
CONSUMER_SECRET_KEY = os.getenv("CONSUMER_SECRET_KEY")
CONSUMER_PUBLIC_KEY = os.getenv("CONSUMER_PUBLIC_KEY")

if not CONSUMER_SECRET_KEY:
    raise EnvironmentError("CONSUMER_SECRET_KEY is not set in .env")
if not CONSUMER_PUBLIC_KEY:
    raise EnvironmentError("CONSUMER_PUBLIC_KEY is not set in .env")


# ─── Wallet helpers ────────────────────────────────────────────────────────────

def get_keypair() -> Keypair:
    return Keypair.from_secret(CONSUMER_SECRET_KEY)


def get_balance() -> float:
    """Return the native XLM balance for the consumer wallet."""
    server = Server(HORIZON_URL)
    account = server.accounts().account_id(CONSUMER_PUBLIC_KEY).call()
    for balance in account["balances"]:
        if balance["asset_type"] == "native":
            return float(balance["balance"])
    return 0.0


def send_payment(destination: str, amount: str, memo: str) -> str:
    """
    Send a native XLM payment from the consumer wallet.

    Args:
        destination: Stellar public key of the recipient.
        amount: Amount in XLM as a string (e.g. "0.10").
        memo: Text memo to attach (max 28 bytes for testnet).

    Returns:
        Transaction hash (str).

    Raises:
        RuntimeError: If the transaction fails to submit.
    """
    keypair = get_keypair()
    server = Server(HORIZON_URL)

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
            asset=Asset.native(),
            amount=str(amount),
        )
        .set_timeout(30)
        .build()
    )

    transaction.sign(keypair)

    try:
        response = server.submit_transaction(transaction)
    except Exception as exc:
        raise RuntimeError(f"Transaction submission failed: {exc}") from exc

    return response["hash"]


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
