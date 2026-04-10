# ─── Signal API — TypeScript/Node ────────────────────────────────────────────
# Multi-stage build: deps → build → runtime
# Base: node:20-alpine (lightweight, ~50 MB)
# Env vars are injected at runtime via docker-compose env_file; .env is never
# copied into the image.

# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: build TypeScript → JavaScript ────────────────────────────────────
FROM deps AS build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Stage 3: runtime image ────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled output
COPY --from=build /app/dist ./dist

EXPOSE 8080

# Healthcheck uses wget (available on alpine) against the /health endpoint
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
