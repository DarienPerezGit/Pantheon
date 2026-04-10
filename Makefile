# ─── Pantheon — Makefile ──────────────────────────────────────────────────────
#
# Developer shortcuts for the Signal Agent Marketplace.
# All targets delegate to the corresponding script in scripts/.
#
# Usage:
#   make setup    Validate environment + Stellar wallet balances
#   make start    Build images and start all services (Docker)
#   make stop     Stop and remove containers
#   make demo     Run a local demo cycle (no Docker)
#   make logs     Stream live Docker logs

.PHONY: setup start stop demo logs

# Resolve the shell to use (bash required for scripts)
SHELL := /usr/bin/env bash

# ── Targets ───────────────────────────────────────────────────────────────────

## setup: Run environment validation + Stellar wallet check
setup:
	@bash scripts/setup.sh

## start: Build Docker images and start all services
start:
	@bash scripts/start.sh

## stop: Stop and remove all containers
stop:
	@bash scripts/stop.sh

## demo: Run one x402 demo cycle locally (no Docker needed)
demo:
	@bash scripts/demo.sh

## logs: Stream logs from all running containers
logs:
	docker-compose logs -f
