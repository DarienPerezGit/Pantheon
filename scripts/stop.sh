#!/usr/bin/env bash
# ─── scripts/stop.sh ──────────────────────────────────────────────────────────
#
# Stop and remove all Pantheon Docker containers.
# Preserves images and volumes.
#
# Usage:
#   ./scripts/stop.sh
#   ./scripts/stop.sh --volumes      also remove named volumes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🛑  Pantheon — Stopping services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

VOLUMES_FLAG=""
if [[ "${1:-}" == "--volumes" || "${1:-}" == "-v" ]]; then
  VOLUMES_FLAG="-v"
  echo "  Removing containers + volumes"
else
  echo "  Removing containers (volumes preserved)"
fi

docker-compose down $VOLUMES_FLAG

echo ""
echo "  ✅  All services stopped."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
