import os
from pathlib import Path
from dotenv import load_dotenv
from stellar_sdk import (
    Server, Keypair, TransactionBuilder,
    Network, Asset
)

load_dotenv(Path("../.env"))

server = Server("https://horizon-testnet.stellar.org")
USDC = Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")

consumer_kp = Keypair.from_secret(os.getenv("CONSUMER_SECRET_KEY"))
acct = server.load_account(consumer_kp.public_key)

print("Swapping XLM → USDC via Stellar DEX testnet...")

tx = (TransactionBuilder(acct, Network.TESTNET_NETWORK_PASSPHRASE, 100)
    # Trustline primero (por si no existe)
    .append_change_trust_op(USDC)
    # Path payment: enviás 10 XLM, recibís mínimo 1 USDC
    .append_path_payment_strict_send_op(
        destination=consumer_kp.public_key,
        send_asset=Asset.native(),
        send_amount="10",
        dest_asset=USDC,
        dest_min="1",
        path=[]
    )
    .set_timeout(30).build())

tx.sign(consumer_kp)
resp = server.submit_transaction(tx)
print("✅ TX hash:", resp["hash"])
print("Verificar:", f"https://stellar.expert/explorer/testnet/tx/{resp['hash']}")
