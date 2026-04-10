#!/usr/bin/env bash
# ─── scripts/setup.sh ─────────────────────────────────────────────────────────
#
# Onboarding script for new developers.
# Validates the environment and prints a clear checklist of what's ready
# and what still needs work before running the project.
#
# Checks:
#   1. Docker is installed and running
#   2. .env exists (copies .env.example and warns if not)
#   3. Required env vars are present in .env
#   4. Stellar wallet balances (SERVER + CONSUMER) via Horizon API
#
# Usage:
#   ./scripts/setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[0;33m'
CYN='\033[0;36m'
BLD='\033[1m'
RST='\033[0m'

OK="${GRN}  ✅ ${RST}"
WARN="${YLW}  ⚠️  ${RST}"
FAIL="${RED}  ❌ ${RST}"

ISSUES=0

echo ""
echo -e "${BLD}${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo -e "${BLD}${CYN}  🔧  Pantheon — Environment Setup Check${RST}"
echo -e "${BLD}${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo ""

# ── 1. Docker ──────────────────────────────────────────────────────────────────
echo -e "${BLD}[1] Docker${RST}"

if command -v docker &>/dev/null; then
  DOCKER_VERSION=$(docker --version 2>/dev/null | head -1 || echo "unknown")
  if docker info &>/dev/null 2>&1; then
    echo -e "${OK}Docker installed and running — ${DOCKER_VERSION}"
  else
    echo -e "${FAIL}Docker installed but daemon is NOT running."
    echo "     Start Docker Desktop, then re-run this script."
    ISSUES=$((ISSUES + 1))
  fi
else
  echo -e "${FAIL}Docker not found."
  echo "     Install: https://docs.docker.com/get-docker/"
  ISSUES=$((ISSUES + 1))
fi

if command -v docker-compose &>/dev/null; then
  COMPOSE_VERSION=$(docker-compose --version 2>/dev/null | head -1 || echo "unknown")
  echo -e "${OK}docker-compose available — ${COMPOSE_VERSION}"
elif docker compose version &>/dev/null 2>&1; then
  echo -e "${OK}docker compose (plugin) available"
else
  echo -e "${WARN}docker-compose not found. Install Docker Desktop v2.x+ for plugin support."
  ISSUES=$((ISSUES + 1))
fi

echo ""

# ── 2. .env file ──────────────────────────────────────────────────────────────
echo -e "${BLD}[2] Environment file (.env)${RST}"

if [ -f ".env" ]; then
  echo -e "${OK}.env exists"
else
  if [ -f ".env.example" ]; then
    cp ".env.example" ".env"
    echo -e "${WARN}.env was missing — copied from .env.example"
    echo "     📝  Edit .env and fill in all required values before continuing."
    ISSUES=$((ISSUES + 1))
  else
    echo -e "${FAIL}Neither .env nor .env.example found. Create .env manually."
    echo "     Required keys: GROQ_API_KEY, SERVER_PUBLIC_KEY, SERVER_SECRET_KEY,"
    echo "                    CONSUMER_PUBLIC_KEY, CONSUMER_SECRET_KEY, HORIZON_URL"
    ISSUES=$((ISSUES + 1))
  fi
fi

echo ""

# ── 3. Required env vars ───────────────────────────────────────────────────────
echo -e "${BLD}[3] Required environment variables${RST}"

# Helper: read a value from .env without sourcing (avoid env pollution)
env_val() {
  grep -E "^${1}=" ".env" 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'"
}

REQUIRED_VARS=(
  GROQ_API_KEY
  SERVER_PUBLIC_KEY
  SERVER_SECRET_KEY
  CONSUMER_PUBLIC_KEY
  CONSUMER_SECRET_KEY
  HORIZON_URL
  SIGNAL_PRICE_XLM
)

for var in "${REQUIRED_VARS[@]}"; do
  val=$(env_val "$var")
  if [ -n "$val" ]; then
    # Mask secrets — show only first 6 chars
    display="${val:0:6}…"
    echo -e "${OK}${var} = ${display}"
  else
    echo -e "${FAIL}${var} is empty or missing"
    ISSUES=$((ISSUES + 1))
  fi
done

echo ""

# ── 4. Stellar wallet balances ────────────────────────────────────────────────
echo -e "${BLD}[4] Stellar wallet balances (Horizon API)${RST}"

HORIZON_URL_VAL=$(env_val "HORIZON_URL")
HORIZON_URL_VAL="${HORIZON_URL_VAL:-https://horizon-testnet.stellar.org}"

SERVER_KEY=$(env_val "SERVER_PUBLIC_KEY")
CONSUMER_KEY=$(env_val "CONSUMER_PUBLIC_KEY")

check_balance() {
  local label="$1"
  local pubkey="$2"

  if [ -z "$pubkey" ]; then
    echo -e "${FAIL}${label}: public key not set — skipping balance check"
    ISSUES=$((ISSUES + 1))
    return
  fi

  # Fetch account from Horizon
  local response
  response=$(curl -sf "${HORIZON_URL_VAL}/accounts/${pubkey}" 2>/dev/null || echo "ERROR")

  if [ "$response" = "ERROR" ]; then
    echo -e "${FAIL}${label} (${pubkey:0:10}…): account not found on testnet"
    echo "     Fund it at: https://laboratory.stellar.org/#account-creator?network=test"
    ISSUES=$((ISSUES + 1))
    return
  fi

  # Extract native XLM balance
  local balance
  balance=$(echo "$response" | grep -o '"balance":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$balance" ]; then
    balance="unknown"
  fi

  local bal_int
  bal_int=$(echo "$balance" | cut -d'.' -f1)

  if [ "${bal_int:-0}" -ge 1 ] 2>/dev/null; then
    echo -e "${OK}${label} (${pubkey:0:10}…): ${balance} XLM"
  else
    echo -e "${WARN}${label} (${pubkey:0:10}…): ${balance} XLM — low balance!"
    echo "     Fund: https://laboratory.stellar.org/#account-creator?network=test"
    ISSUES=$((ISSUES + 1))
  fi
}

check_balance "Server wallet  " "$SERVER_KEY"
check_balance "Consumer wallet" "$CONSUMER_KEY"

echo ""

# ── Summary ────────────────────────────────────────────────────────────────────
echo -e "${BLD}${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
if [ "$ISSUES" -eq 0 ]; then
  echo -e "${GRN}${BLD}  ✅  All checks passed — you're ready to go!${RST}"
  echo ""
  echo "  Next steps:"
  echo "    make start      # Start all services (Docker)"
  echo "    make demo       # Run a local demo cycle"
  echo "    make logs       # Stream container logs"
else
  echo -e "${YLW}${BLD}  ⚠️   ${ISSUES} issue(s) found — fix them before starting.${RST}"
  echo ""
  echo "  After fixing, re-run:"
  echo "    ./scripts/setup.sh"
fi
echo -e "${BLD}${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo ""
