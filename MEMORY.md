# MEMORY.md — Pantheon: Fuente de Verdad del Proyecto

> Generado el **10 de abril de 2026**. Usar como punto de partida en nuevas sesiones de desarrollo.

---

## 1. Project Status & Stack

### Hackathon
- **Nombre:** Stellar Hacks: Agents (Agentic Hackathon) — DoraHacks
- **Premio:** $10,000 USD en XLM (1er lugar $5,000)
- **Deadline:** 13 de abril de 2026, 14:00 UTC
- **Requisitos obligatorios:** Repo público + README + video demo 2-3 min + TXs reales en Stellar testnet

### Concepto
**Pantheon — Signal Agent Marketplace.** Un agente consumidor autónomo (Python + Groq LLM) paga micropagos en Stellar XLM para obtener señales de trading de un servidor productor (Go API), usando el protocolo **x402** como capa de monetización machine-to-machine. El pain point central del hackathon es *"los agentes no pueden pagar"* — este proyecto lo resuelve de forma demostrable y on-chain.

### Stack Actual

| Capa | Tecnología | Puerto / Ubicación |
|---|---|---|
| Signal API (servidor) | **Go 1.22** + `godotenv` + Horizon SDK | `:8080` |
| Consumer Agent | **Python 3.12** + `stellar-sdk` + `openai` (Groq) | proceso local |
| LLM Decision | **Groq** `llama-3.1-8b-instant` via OpenAI-compatible API | externo |
| Dashboard | **Next.js 16.2.3** App Router + TypeScript + Tailwind CSS 3.4.1 | `:3000` |
| Infraestructura | **Docker Compose** + Makefile + Bash scripts | `docker-compose.yml` |
| Red Blockchain | **Stellar Testnet** via Horizon API | `https://horizon-testnet.stellar.org` |

---

## 2. Architecture & Decoupling

### Mapa de Servicios

```
┌──────────────────────────────────┐       polling /state cada 5s
│   Next.js Dashboard :3000        │ ◄─────────────────────────────────────┐
│   signal-dashboard/              │                                        │
└──────────────────────────────────┘                                        │
                                                                            │
┌──────────────────────────────────┐    x402 handshake                     │
│   Consumer Agent (Python)        │──────────────────► Go Signal API :8080 │
│   consumer-agent/agent.py        │  GET /signal?pair=X                   │
│   consumer-agent/wallet.py       │  ◄── 402 {destination, amount, memo}  │
│   consumer-agent/x402_client.py  │  send_payment() → Stellar TX          │
└──────────────────────────────────┘  GET /signal + X-Payment: <txhash>    │
                                       ──────────────────────────────────►  │
                                       ◄── 200 {signal, confidence, ...}    │
                                                                            │
┌──────────────────────────────────────────────────────────────────────────┘
│   Go Signal API :8080
│   signal-api/main.go
│   Endpoints: GET /health, GET /signal, GET /state, GET /ui/
│   CORS: corsMiddleware → solo permite http://localhost:3000
│   State: agentState global (sync.RWMutex) → actualizado por recordSignal()
└──────────────────────────────────────────────────────────────────────────
```

### Protocolo x402 — Flujo Completo

1. Consumer Agent hace `GET /signal?pair=BTC-USDC` (sin headers de pago)
2. Go API responde `402 Payment Required` con:
   ```json
   { "error": "payment required", "amount": "0.10", "asset": "XLM",
     "destination": "GBZWI25V...2XVN", "memo": "signal-btc-usdc" }
   ```
3. `wallet.py::send_payment()` construye TX Stellar con SDK, la firma y la envía a Horizon
4. `wallet.py::wait_for_confirmation()` espera confirmación on-chain
5. Consumer retry: `GET /signal?pair=BTC-USDC` con header `X-Payment: <txhash>`
6. Go API verifica TX en Horizon: monto correcto + destinatario = `SERVER_PUBLIC_KEY`
7. Si válido → genera señal (Claude si hay `ANTHROPIC_API_KEY`, sino mock pool inteligente)
8. Llama a `recordSignal()` → actualiza `agentState` global
9. Dashboard en `:3000` hace poll a `GET /state` cada 5s y renderiza datos live

### Integración de IA

- **Groq (llama-3.1-8b-instant):** Decisión autónoma del consumer agent — dado el signal recibido, ¿ejecuto la operación? Responde JSON `{execute: bool, reasoning: string}`.
- **Claude / Mock pool:** El Signal API genera el contenido de la señal. Si `ANTHROPIC_API_KEY` está configurada usa Claude; si no, selecciona aleatoriamente de un pool de 5 `reasonings` predefinidos en `main.go`.
- **Fallback rule-based:** Si `GROQ_API_KEY` no está presente, el agent usa threshold de confianza ≥ 0.65 para decidir.

---

## 3. Infrastructure Achievements

### Docker Compose
`docker-compose.yml` en la raíz define dos servicios con healthchecks:

```yaml
# Resumen de la estructura:
services:
  signal-api:
    build: ./signal-api
    ports: ["8080:8080"]
    env_file: .env
    healthcheck: { test: curl /health, interval: 10s }
  consumer-agent:
    build: ./consumer-agent
    env_file: .env
    depends_on:
      signal-api: { condition: service_healthy }
```

### Makefile (`make` targets)

| Comando | Acción |
|---|---|
| `make setup` | Valida `.env` + balances de wallets Stellar |
| `make start` | Build + start Docker Compose |
| `make stop` | Stop + remove containers |
| `make demo` | Demo local sin Docker (un ciclo completo) |
| `make logs` | Stream de logs de todos los contenedores |

Los scripts viven en `scripts/` (setup.sh, start.sh, stop.sh, demo.sh).

### Rama de trabajo
- **Branch activo:** `master`
- **Branch default:** `main`
- PRs anteriores #1–#4 mergeados a `main` (infraestructura base)
- Pendiente: PR de `master` → `main` con todos los cambios actuales

---

## 4. Current Milestone — Sistema End-to-End Operacional

### Estado Actual (10 abril 2026)

El sistema **es funcional end-to-end**. Se han verificado ciclos reales con transacciones on-chain en Stellar testnet.

**Confirmado funcionando:**
- ✅ Go Signal API compila y arranca (`go run .` en `signal-api/`)
- ✅ Consumer Agent ejecuta ciclos x402 autónomos (sin intervención humana)
- ✅ Transacciones XLM reales enviadas y verificadas en Stellar Testnet
- ✅ `recordSignal()` actualiza el estado global en Go correctamente
- ✅ Next.js Dashboard renderiza en `localhost:3000`
- ✅ CORS configurado con `corsMiddleware` en `main.go` (`http://localhost:3000`)
- ✅ Dashboard polling `/state` cada 5s y renderizando datos live
- ✅ Ciclo 19 alcanzado en sesiones anteriores (validación multi-ciclo)

**Wallets Stellar Testnet:**

| Rol | Clave Pública |
|---|---|
| Signal API Server | `GBZWI25VLQRRNZOZAPPYLSGME5HPLAWYN3BUE3ZPRHBZSNGIS4U62XVN` |
| Consumer Agent | `GDYJ5LX3Q5LVSZ3GXWIGEZP22VPRXEK4IWJGJVDF5M6WJIEHF3ZK4NDS` |

### Archivos Clave y su Estado

| Archivo | Propósito | Estado |
|---|---|---|
| `signal-api/main.go` | Go HTTP server, x402 middleware, `/state` endpoint, CORS | ✅ Funcional |
| `consumer-agent/agent.py` | Loop principal: ciclo → pago → LLM decision | ✅ Funcional |
| `consumer-agent/wallet.py` | SDK Stellar: send_payment(), get_balance(), wait_for_confirmation() | ✅ Funcional |
| `consumer-agent/x402_client.py` | Cliente HTTP x402: maneja 402, reintenta con TX hash | ✅ Funcional |
| `signal-dashboard/app/page.tsx` | Página principal Next.js, compone todos los componentes | ✅ Funcional |
| `signal-dashboard/hooks/useAgentState.ts` | Polling hook, manejo de error sin mock | ✅ Funcional |
| `signal-dashboard/lib/types.ts` | Interfaces TypeScript + constantes de wallets | ✅ Funcional |
| `signal-dashboard/components/` | Header, HeroStats, CycleVisualizer, ReasoningTerminal, TransactionTable | ✅ Funcional |
| `docker-compose.yml` | Orquestación de servicios con healthchecks | ✅ Existe |
| `Makefile` | Developer shortcuts | ✅ Existe |

---

## 5. Critical Configurations

### Variables de Entorno (`.env` en raíz del proyecto)

```bash
# Groq API — decisiones LLM del consumer agent
GROQ_API_KEY=<tu_key_de_console.groq.com>

# Stellar — Signal API Server
SERVER_PUBLIC_KEY=GBZWI25VLQRRNZOZAPPYLSGME5HPLAWYN3BUE3ZPRHBZSNGIS4U62XVN
SERVER_SECRET_KEY=<clave_secreta_del_servidor>

# Stellar — Consumer Agent
CONSUMER_PUBLIC_KEY=GDYJ5LX3Q5LVSZ3GXWIGEZP22VPRXEK4IWJGJVDF5M6WJIEHF3ZK4NDS
CONSUMER_SECRET_KEY=<clave_secreta_del_consumer>

# Configuración
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
SIGNAL_PRICE_XLM=0.10
SIGNAL_API_URL=http://localhost:8080

# Opcional — Claude para generación de señales en el servidor
ANTHROPIC_API_KEY=<tu_key_si_tienes>
```

> **IMPORTANTE:** El `.env` no se commitea. El `.env.example` en el repo sirve de template.

### CORS en Go (`signal-api/main.go`)

El servidor usa `corsMiddleware` que envuelve el mux completo:

```go
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Payment")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}
// En main(): http.ListenAndServe(":8080", corsMiddleware(mux))
```

### Dashboard — Variable de Entorno Next.js

El hook `useAgentState.ts` usa:
```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080'
```
En producción, crear `.env.local` en `signal-dashboard/` con `NEXT_PUBLIC_API_BASE=<url>`.

---

## 6. Cómo Levantar el Sistema Localmente

```powershell
# Terminal 1 — Signal API (Go)
Push-Location "C:\Users\PC\Desktop\Pantheon\signal-api"
go run .

# Terminal 2 — Next.js Dashboard
Push-Location "C:\Users\PC\Desktop\Pantheon\signal-dashboard"
npm run dev

# Terminal 3 — Consumer Agent (Python)
Push-Location "C:\Users\PC\Desktop\Pantheon\consumer-agent"
python agent.py BTC-USDC
```

**Resultado esperado:**
- Go API en `http://localhost:8080` (logs: `[START] Signal API listening on :8080`)
- Dashboard en `http://localhost:3000` (header muestra `● LIVE · STELLAR TESTNET` en verde)
- Consumer Agent logea ciclos: `[CYCLE] --- Ciclo N ---` → `[402]` → `[PAYMENT]` → `[SIGNAL]` → `[GROQ]`

---

## 7. Pending Tasks — Sprint Final (antes del 13 abril)

### P1 — Git: Commit y PR
- [ ] Hacer commit de todos los cambios actuales en `master`
- [ ] Abrir PR de `master` → `main`
- [ ] Revisar que el README refleja el estado actual

### P2 — README.md: Tablas de TX
- [ ] Actualizar la sección de transacciones verificadas con hashes reales del Ciclo 19+
- [ ] Usar el explorador: `https://stellar.expert/explorer/testnet/tx/<hash>`
- [ ] Formato esperado:

  | Ciclo | Par | Señal | Monto | TX Hash |
  |---|---|---|---|---|
  | 1 | BTC-USDC | BUY | 0.10 XLM | `<hash>` |

### P3 — Video Demo (2-3 minutos)
Puntos clave a cubrir en el video:

1. **Intro (20s):** "Los agentes no pueden pagar. Pantheon lo resuelve."
2. **Código (40s):** Mostrar `agent.py` — el loop autónomo, sin `input()`, sin intervención humana
3. **Demo en vivo (60s):**
   - Arrancar Go API + Consumer Agent, ver ciclo completo en terminal
   - Abrir `stellar.expert` y mostrar TX confirmada on-chain
4. **Dashboard (30s):**
   - Mostrar `localhost:3000` con estado live: señal, ciclo, tabla de TXs
   - Header en verde: `LIVE · STELLAR TESTNET`
5. **Cierre (10s):** x402 protocol + Stellar = el futuro de los micropagos agentic

### P4 — Opcional: Mejorar README
- [ ] Diagrama ASCII de la arquitectura (ya está en CONTEXT.md)
- [ ] Instrucciones de setup con `make setup` y `make demo`
- [ ] Screenshot del dashboard en el README

---

## 8. Estructura del Repositorio

```
Pantheon/
├── .env                    # Secrets locales (NO commitear)
├── .env.example            # Template de variables
├── .gitignore
├── docker-compose.yml      # Orquestación Docker con healthchecks
├── Makefile                # make setup | start | stop | demo | logs
├── README.md               # Documentación pública del proyecto
├── CONTEXT.md              # Contexto original del hackathon
├── MEMORY.md               # Este archivo — fuente de verdad
├── scripts/
│   ├── setup.sh
│   ├── start.sh
│   ├── stop.sh
│   └── demo.sh
├── signal-api/             # Go HTTP Server (puerto 8080)
│   ├── main.go             # Todo en un solo archivo: handlers, x402, state, CORS
│   ├── go.mod
│   └── go.sum
├── consumer-agent/         # Python Autonomous Agent
│   ├── agent.py            # Loop principal + Groq LLM decision
│   ├── wallet.py           # Stellar SDK: send, confirm, balance
│   ├── x402_client.py      # HTTP client para el handshake x402
│   └── requirements.txt
├── signal-dashboard/       # Next.js 16 Dashboard (puerto 3000)
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Header.tsx          # Estado LIVE/ERROR + branding
│   │   ├── HeroStats.tsx       # Cycle, Signal, Confidence
│   │   ├── CycleVisualizer.tsx # Flujo de 5 pasos animado
│   │   ├── ReasoningTerminal.tsx
│   │   └── TransactionTable.tsx
│   ├── hooks/
│   │   └── useAgentState.ts    # Polling hook, sin mock data
│   ├── lib/
│   │   └── types.ts            # Interfaces TS + constantes de wallets
│   ├── next.config.mjs
│   ├── package.json            # Next 16.2.3, Tailwind 3.4.1
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── dashboard/              # Dashboard estático legado (HTML vanilla — reemplazado)
```
