from stellar_sdk import Server, Keypair, Network, TransactionBuilder, Asset, PathPaymentStrictReceive
import os
from dotenv import load_dotenv

load_dotenv(".env")
server = Server("https://horizon-testnet.stellar.org")
consumer_secret = os.getenv("CONSUMER_SECRET_KEY")
kp = Keypair.from_secret(consumer_secret)

USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
usdc = Asset("USDC", USDC_ISSUER)
xlm = Asset.native()

acc = server.load_account(kp.public_key)

op = PathPaymentStrictReceive(
    send_asset=xlm,
    send_max="500.0",
    destination=kp.public_key,
    dest_asset=usdc,
    dest_amount="5.0",
    path=[]
)

tx = TransactionBuilder(
    source_account=acc,
    network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
    base_fee=100
).append_change_trust_op(asset=usdc).append_operation(op).set_timeout(30).build()

tx.sign(kp)
try:
    resp = server.submit_transaction(tx)
    print("Swap successful:", resp["hash"])
except Exception as e:
    print("Failed to swap:", e)
