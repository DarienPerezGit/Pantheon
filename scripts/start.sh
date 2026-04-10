#!/usr/bin/env bash
# ─── scripts/start.sh ─────────────────────────────────────────────────────────
#
# Start all Pantheon services via Docker Compose.
# Builds images if they don't exist or if source has changed.
#
# Usage:
#   ./scripts/start.sh
#   ./scripts/start.sh --detach      run in background (-d flag)
#
# Prerequisites:
#   - Docker running
#   - .env file present in the repo root
#   - Run scripts/setup.sh first to validate environment

set -euo pipefail

# ── Resolve repo root ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

# ── Guard checks ──────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "❌  .env not found. Run ./scripts/setup.sh first."
  exit 1
fi

if ! command -v docker &>/dev/null; then
  echo "❌  Docker not found. Install Docker Desktop from https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  echo "❌  Docker daemon is not running. Start Docker Desktop."
  exit 1
fi

# ── Launch ────────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀  Pantheon — Starting services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DETACH_FLAG=""
if [[ "${1:-}" == "--detach" || "${1:-}" == "-d" ]]; then
  DETACH_FLAG="-d"
  echo "  Mode: detached (logs: docker-compose logs -f)"
else
  echo "  Mode: attached (Ctrl+C to stop)"
fi

echo ""
docker-compose up --build $DETACH_FLAG

if [[ -n "$DETACH_FLAG" ]]; then
  echo ""
  echo "  Services started in background."
  echo "  Signal API → http://localhost:8080"
  echo "  Logs       → docker-compose logs -f"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
