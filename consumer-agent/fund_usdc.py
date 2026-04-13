import os
from dotenv import load_dotenv
from pathlib import Path
from stellar_sdk import Server, Keypair, TransactionBuilder, Network, Asset

load_dotenv(Path(__file__).parent.parent / ".env")

server = Server("https://horizon-testnet.stellar.org")
USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

# SERVER le manda USDC al CONSUMER
server_kp = Keypair.from_secret(os.getenv("SERVER_SECRET_KEY"))
consumer_pk = os.getenv("CONSUMER_PUBLIC_KEY")

account = server.load_account(server_kp.public_key)
tx = (TransactionBuilder(account, Network.TESTNET_NETWORK_PASSPHRASE, 100)
    .append_payment_op(consumer_pk, Asset("USDC", USDC_ISSUER), "100")
    .set_timeout(30).build())
tx.sign(server_kp)
resp = server.submit_transaction(tx)
print("TX hash:", resp["hash"])
