#!/usr/bin/env bash
# ─── scripts/demo.sh ──────────────────────────────────────────────────────────
#
# Run a single x402 demo cycle locally — no Docker required.
#
# What it does:
#   1. Checks that the Signal API is running on :8080
#   2. Installs Python deps if they're missing
#   3. Runs python agent.py BTC-USDC (one-shot or loop depending on agent.py)
#
# Usage:
#   ./scripts/demo.sh                  default pair: BTC-USDC
#   ./scripts/demo.sh ETH-USDC         custom pair

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[0;33m'
CYN='\033[0;36m'
BLD='\033[1m'
RST='\033[0m'

PAIR="${1:-BTC-USDC}"

echo ""
echo -e "${BLD}${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo -e "${BLD}${CYN}  🔮  Pantheon Demo — pair: ${PAIR}${RST}"
echo -e "${BLD}${CYN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo ""

# ── 1. Check Signal API ────────────────────────────────────────────────────────
echo -e "${YLW}[1/3] Checking Signal API on :8080 …${RST}"

API_URL="${SIGNAL_API_URL:-http://localhost:8080}"

if curl -sf "${API_URL}/health" >/dev/null 2>&1; then
  echo -e "${GRN}  ✅  Signal API is up — ${API_URL}/health${RST}"
else
  echo -e "${RED}  ❌  Signal API is NOT running on ${API_URL}${RST}"
  echo ""
  echo "  Start it first:"
  echo "    # Go server (always works):"
  echo "    cd signal-api && go run ."
  echo ""
  echo "    # TypeScript server:"
  echo "    cd signal-api-ts && npx tsx src/index.ts"
  echo ""
  echo "    # Or with Docker:"
  echo "    ./scripts/start.sh --detach"
  exit 1
fi

# ── 2. Python deps ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YLW}[2/3] Checking Python dependencies …${RST}"

AGENT_DIR="$REPO_ROOT/consumer-agent"

MISSING=false
while IFS= read -r pkg || [[ -n "$pkg" ]]; do
  # Strip version qualifier and whitespace
  mod=$(echo "$pkg" | sed 's/[>=<!\[].*//' | tr -d ' ' | tr '-' '_' | tr '[:upper:]' '[:lower:]')
  [[ -z "$mod" || "$mod" == \#* ]] && continue
  if ! python3 -c "import $mod" 2>/dev/null; then
    MISSING=true
    break
  fi
done < "$AGENT_DIR/requirements.txt"

if $MISSING; then
  echo -e "  Installing missing packages …"
  pip install -q -r "$AGENT_DIR/requirements.txt"
  echo -e "${GRN}  ✅  Dependencies installed${RST}"
else
  echo -e "${GRN}  ✅  All dependencies present${RST}"
fi

# ── 3. Run agent ───────────────────────────────────────────────────────────────
echo ""
echo -e "${YLW}[3/3] Running consumer agent (pair: ${PAIR}) …${RST}"
echo -e "  ${BLD}Ctrl+C${RST} to stop the loop"
echo ""
echo -e "${BLD}${CYN}─────────────────────── agent output ───────────────────────${RST}"

cd "$AGENT_DIR"
PYTHONUNBUFFERED=1 python3 agent.py "$PAIR" 2>&1 | sed \
  -e "s/\[AGENT\]/$(printf "${CYN}[AGENT]${RST}")/g"   \
  -e "s/\[GROQ\]/$(printf "${GRN}[GROQ]${RST}")/g"     \
  -e "s/\[SIGNAL\]/$(printf "${GRN}[SIGNAL]${RST}")/g" \
  -e "s/\[PAYMENT\]/$(printf "${YLW}[PAYMENT]${RST}")/g" \
  -e "s/\[402\]/$(printf "${YLW}[402]${RST}")/g"       \
  -e "s/\[ERROR\]/$(printf "${RED}[ERROR]${RST}")/g"   \
  -e "s/\[DECISION\]/$(printf "${GRN}[DECISION]${RST}")/g"
