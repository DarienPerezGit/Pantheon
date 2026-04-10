# ─── Consumer Agent — Python ──────────────────────────────────────────────────
# Base: python:3.11-slim (lightweight, no dev tools)
# Env vars are injected at runtime via docker-compose env_file; .env is never
# copied into the image.
#
# The agent reads SIGNAL_API_URL from the environment. In Docker that should
# point to the signal-api service: http://signal-api:8080

FROM python:3.11-slim
WORKDIR /app

# Install deps first (layer cache friendly)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent source
COPY agent.py wallet.py x402_client.py ./

# Default trading pair — override via CMD or ENTRYPOINT in compose
ENV TRADING_PAIR=BTC-USDC

CMD ["sh", "-c", "python agent.py ${TRADING_PAIR}"]
