import os
from pathlib import Path
from dotenv import load_dotenv
from stellar_sdk import Server, Keypair, TransactionBuilder, Network, Asset
import urllib.request, json

load_dotenv(Path("../.env"))

server = Server("https://horizon-testnet.stellar.org")
USDC = Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")

server_kp  = Keypair.from_secret(os.getenv("SERVER_SECRET_KEY"))
consumer_pk = os.getenv("CONSUMER_PUBLIC_KEY")

# Paso 1: Trustline USDC en SERVER
print("1. Agregando trustline USDC al SERVER...")
acct = server.load_account(server_kp.public_key)
tx = (TransactionBuilder(acct, Network.TESTNET_NETWORK_PASSPHRASE, 100)
    .append_change_trust_op(USDC)
    .set_timeout(30).build())
tx.sign(server_kp)
resp = server.submit_transaction(tx)
print("   Trustline OK:", resp["hash"])

# Paso 2: Fondear SERVER con USDC via Friendbot
print("2. Fondeando SERVER con USDC testnet...")
url = f"https://friendbot-testnet.stellar.org/usdc?addr={server_kp.public_key}"
with urllib.request.urlopen(url) as r:
    print("   Friendbot OK:", json.loads(r.read())["hash"])

# Paso 3: SERVER → CONSUMER 100 USDC
print("3. Enviando 100 USDC SERVER → CONSUMER...")
acct = server.load_account(server_kp.public_key)
tx = (TransactionBuilder(acct, Network.TESTNET_NETWORK_PASSPHRASE, 100)
    .append_payment_op(consumer_pk, USDC, "100")
    .set_timeout(30).build())
tx.sign(server_kp)
resp = server.submit_transaction(tx)
print("   TX hash:", resp["hash"])
print("\n✅ CONSUMER fondeado con 100 USDC. Corré agent.py BTC-USDC")
