import os
from pathlib import Path
from dotenv import load_dotenv
from stellar_sdk import Server

load_dotenv(Path("../.env"))
server = Server("https://horizon-testnet.stellar.org")
consumer_pk = os.getenv("CONSUMER_PUBLIC_KEY")

data = server.accounts().account_id(consumer_pk).call()
print("=== BALANCES ===")
for b in data["balances"]:
    if b["asset_type"] != "native":
        print(f"Asset: {b['asset_code']} | Issuer: {b['asset_issuer']} | Balance: {b['balance']}")
    else:
        print(f"XLM: {b['balance']}")
