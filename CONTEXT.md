# Signal Agent Marketplace — Contexto del Proyecto

## Hackathon

- **Nombre:** Stellar Hacks: Agents (Agentic Hackathon)
- **Plataforma:** DoraHacks
- **Premio:** $10,000 USD en XLM (1er lugar: $5,000)
- **Deadline:** 13 de abril de 2026, 14:00 UTC
- **Días restantes:** ~4 días
- **Requisitos obligatorios:**
  - Repo público con README detallado
  - Video demo 2–3 minutos
  - Transacciones reales en Stellar testnet o mainnet

---

## Concepto del Proyecto

**Signal Agent Marketplace** — Un sistema donde un agente consumidor (LLM) paga micropagos en Stellar para obtener señales de trading de un agente productor (API HTTP), usando el protocolo x402 como capa de monetización.

### Propuesta de valor

El pain point central del hackathon es: *los agentes no pueden pagar*. Este proyecto lo resuelve directamente y de forma demostrable. Un agente LLM que decide autónomamente comprar información, paga en stablecoins sobre Stellar, y actúa sobre esa información — todo sin intervención humana.

### Inspiración

- Trading Arena (tradingarena.xyz) — agentes de trading con Claude como modelo
- x402 protocol — HTTP 402 Payment Required como estándar de micropagos machine-to-machine

---

## Arquitectura (Scope Reducido — MVP)

```
┌─────────────────────────────────────┐
│         Consumer Agent              │
│  - Python + Claude API              │
│  - Tiene wallet Stellar (testnet)   │
│  - Decide cuándo pedir señales      │
│  - Paga automáticamente vía x402   │
└────────────────┬────────────────────┘
                 │  HTTP GET /signal?pair=BTC-USDC
                 │  + x402 payment header
                 ▼
┌─────────────────────────────────────┐
│         Signal Agent API            │
│  - Go o Python (FastAPI)            │
│  - Middleware x402                  │
│  - Si no hay pago → 402             │
│  - Si pago válido → retorna señal   │
│  - Señal generada por LLM o mock    │
└─────────────────────────────────────┘
                 │
                 │  Verifica pago en
                 ▼
┌─────────────────────────────────────┐
│         Stellar Testnet             │
│  - Red de pagos                     │
│  - USDC o XLM como token de pago   │
│  - Horizon API para verificación   │
└─────────────────────────────────────┘
```

### Lo que NO se construye (scope explícitamente reducido)

- ~~Contratos Soroban~~
- ~~Múltiples agentes compitiendo~~
- ~~Leaderboard real~~
- ~~Trades reales con dinero~~
- ~~Frontend complejo~~

---

## Componentes Técnicos

### 1. Signal Agent API (Servidor — Go o Python)

**Responsabilidades:**
- Exponer endpoint `GET /signal?pair=<PAIR>`
- Implementar middleware x402: leer header `X-Payment`, verificar transacción en Stellar Horizon
- Si pago inválido o ausente → responder `402 Payment Required` con instrucciones de pago
- Si pago válido → generar y retornar señal (BUY / SELL / HOLD + confianza + razonamiento)
- Opcional: endpoint `GET /health` y `GET /pairs` para listar pares disponibles

**Stack recomendado:** Go (nativo, rápido de escribir para HTTP servers) o Python con FastAPI

**Estructura de respuesta (señal):**
```json
{
  "pair": "BTC-USDC",
  "signal": "BUY",
  "confidence": 0.72,
  "reasoning": "RSI oversold, momentum positivo en últimas 4h",
  "timestamp": "2026-04-09T12:00:00Z",
  "valid_for_seconds": 300
}
```

**Estructura de error 402:**
```json
{
  "error": "Payment required",
  "amount": "0.10",
  "asset": "USDC",
  "destination": "GABCD...XYZ",
  "network": "stellar-testnet",
  "memo": "signal-btc-usdc"
}
```

---

### 2. x402 Middleware

**Qué es x402:**
- Protocolo que usa el código HTTP 402 ("Payment Required") como mecanismo nativo de monetización
- El cliente recibe un 402, lee las instrucciones de pago, realiza la transacción on-chain, y reenvía el request con proof de pago
- Stellar es ideal: pagos en ~5 segundos, fees de fracciones de centavo

**Flujo detallado:**
```
1. Consumer → GET /signal (sin header de pago)
2. Server  → 402 + {amount, destination, memo}
3. Consumer → construye y firma tx Stellar
4. Consumer → GET /signal + header X-Payment: <tx_hash>
5. Server  → verifica tx en Horizon API
6. Server  → 200 OK + señal
```

**Verificación en Horizon:**
```
GET https://horizon-testnet.stellar.org/transactions/<tx_hash>
```
Verificar: `to == server_wallet`, `amount >= precio`, `memo == esperado`

**Librerías útiles:**
- Python: `stellar-sdk` (pip)
- Go: `stellar/go` SDK
- JS/TS: `@stellar/stellar-sdk` (si se hace frontend)

---

### 3. Consumer Agent (Python + Claude API)

**Responsabilidades:**
- Loop de decisión: cada N segundos, evaluar si pedir una señal
- Manejar el handshake x402 automáticamente (interceptar 402, pagar, reintentar)
- Usar Claude API para interpretar la señal y "decidir" qué hacer
- Loggear todas las operaciones (pagos, señales, decisiones)

**Prompt base del agente:**
```
You are an autonomous trading agent with a Stellar wallet.
You can purchase trading signals by paying micropayments.
Current portfolio: {portfolio}
Latest signal received: {signal}
Decide: should you buy, sell, or hold? Explain your reasoning briefly.
```

**Variables de entorno necesarias:**
```
ANTHROPIC_API_KEY=sk-ant-...
STELLAR_SECRET_KEY=S...        # wallet del consumer
SIGNAL_API_URL=http://localhost:8080
SIGNAL_PRICE_XLM=0.10
```

---

### 4. Demo UI (Opcional pero recomendado para el video)

Una página HTML simple o terminal con:
- Pagos realizados (tx hash con link a Stellar Explorer)
- Señales recibidas
- Decisiones del agente
- Balance de wallet en tiempo real

Puede ser un simple `tail -f agent.log` formateado o una página estática con polling.

---

## Stellar Testnet — Setup Inicial

### Crear wallet testnet
```bash
# Usando Stellar Laboratory o SDK
# https://laboratory.stellar.org/#account-creator?network=test

# Con Python SDK:
pip install stellar-sdk
python3 -c "
from stellar_sdk import Keypair
kp = Keypair.random()
print('Public key:', kp.public_key)
print('Secret key:', kp.secret)
"
```

### Fondear con Friendbot (gratis en testnet)
```bash
curl "https://friendbot.stellar.org/?addr=<TU_PUBLIC_KEY>"
```

### Verificar balance
```bash
curl "https://horizon-testnet.stellar.org/accounts/<TU_PUBLIC_KEY>"
```

### Endpoints Horizon Testnet
```
Base URL:     https://horizon-testnet.stellar.org
Accounts:     /accounts/<address>
Transactions: /transactions/<hash>
Payments:     /accounts/<address>/payments
```

### USDC en testnet
- USDC testnet issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- Alternativamente usar XLM nativo (más simple para MVP)

---

## Estructura del Repositorio

```
signal-agent-marketplace/
├── README.md                    # Descripción completa del proyecto
├── CONTEXT.md                   # Este archivo
├── .env.example                 # Variables de entorno necesarias
│
├── signal-api/                  # Signal Agent API (Go o Python)
│   ├── main.go (o main.py)
│   ├── middleware/
│   │   └── x402.go              # Middleware de verificación de pagos
│   ├── handlers/
│   │   └── signal.go            # Handler del endpoint /signal
│   └── stellar/
│       └── verify.go            # Verificación de transacciones en Horizon
│
├── consumer-agent/              # Consumer Agent (Python)
│   ├── agent.py                 # Loop principal del agente
│   ├── wallet.py                # Manejo de wallet Stellar
│   ├── x402_client.py           # Cliente que maneja el handshake 402
│   └── prompts.py               # Prompts para Claude API
│
├── scripts/
│   ├── setup_testnet.sh         # Script para crear y fondear wallets testnet
│   └── demo.sh                  # Script para correr el demo completo
│
└── demo/
    └── index.html               # UI simple para el video demo (opcional)
```

---

## Plan de 4 Días

### Día 1 (Hoy) — Fundaciones
- [ ] Leer docs de x402: https://x402.org/docs
- [ ] Leer docs de Stellar SDK (Python o Go)
- [ ] Crear wallets testnet (server + consumer)
- [ ] Fondear wallets con Friendbot
- [ ] Scaffold del Signal API con endpoint básico
- [ ] Verificar que una transacción en testnet se puede leer desde Horizon

**Checkpoint:** Poder hacer una transacción XLM en testnet y leer su hash en Horizon.

### Día 2 — x402 End-to-End
- [ ] Implementar middleware x402 en el Signal API
- [ ] Implementar `x402_client.py` en el Consumer Agent
- [ ] Lograr el flujo completo: 402 → pago → señal
- [ ] Agregar logging detallado

**Checkpoint:** El Consumer Agent paga y recibe una señal (aunque sea mock).

### Día 3 — Integrar LLM + Pulir
- [ ] Integrar Claude API en el Consumer Agent (razonamiento sobre señales)
- [ ] Generar señales reales con LLM en el Signal API (o datos mock convincentes)
- [ ] Escribir README completo
- [ ] Probar el flujo 5+ veces end-to-end
- [ ] Demo UI o log bonito

**Checkpoint:** Demo completo funcionando, README listo.

### Día 4 — Video + Submit
- [ ] Grabar video demo de 2–3 minutos
- [ ] Subir repo a GitHub (asegurarse que sea público)
- [ ] Verificar requisitos del hackathon: repo, video, transacciones reales
- [ ] Hacer submit en DoraHacks antes de las 14:00 UTC

---

## README del Proyecto (Borrador)

El README final debe incluir:

1. **What it does** — agentes que se pagan entre sí por señales de trading usando Stellar
2. **Problem solved** — agents can't pay; x402 on Stellar fixes this
3. **How it works** — diagrama del flujo con x402
4. **Tech stack** — Python, Go, Stellar SDK, x402, Claude API
5. **Setup instructions** — clonar, configurar env, correr scripts
6. **Stellar transactions** — links a transacciones reales en testnet explorer
7. **Video link**
8. **What's next** — Soroban spending policies, multi-agent marketplace, real DEX integration

---

## Recursos Clave

### x402
- Docs: https://x402.org/docs
- GitHub: https://github.com/coinbase/x402
- Python facilitator client: buscar en el repo de x402

### Stellar
- Docs: https://developers.stellar.org
- Horizon Testnet: https://horizon-testnet.stellar.org
- Laboratory (UI para testnet): https://laboratory.stellar.org
- Friendbot (faucet): https://friendbot.stellar.org
- Python SDK: https://stellar-sdk.readthedocs.io
- Go SDK: https://github.com/stellar/go

### Claude API
- Docs: https://docs.anthropic.com
- Modelo a usar: `claude-sonnet-4-20250514`
- Python SDK: `pip install anthropic`

### Stellar Explorer (Testnet)
- https://stellar.expert/explorer/testnet
- https://stellarchain.io/testnet

---

## Criterios de Evaluación (Inferidos)

Basado en los requisitos del hackathon:

1. **Uso real de Stellar** — transacciones on-chain verificables (NO mock)
2. **Innovación del concepto** — cuán bien resuelve el problema de "agents that can pay"
3. **Calidad técnica** — código limpio, arquitectura coherente, README detallado
4. **Demo convincente** — el video debe mostrar el flujo completo claramente
5. **Completitud** — ¿funciona end-to-end?

### Ventajas competitivas de este proyecto
- Concepto claro y directo al tema del hackathon
- Demo muy visual (se ven los pagos en Stellar Explorer en tiempo real)
- Scope manejable en 4 días
- x402 es exactamente lo que el hackathon menciona explícitamente

---

## Notas Importantes

- **Usar testnet**, no mainnet, para el desarrollo. Para el submission, testnet está explícitamente permitido.
- **Documentar todo** en el README aunque algo no esté terminado. Los jueces valoran la transparencia.
- **El video es crítico** — practicar el demo antes de grabar.
- Si hay tiempo, agregar **Soroban spending policies** sería un diferenciador fuerte (el contrato limita cuánto puede gastar el agent automáticamente).
- Mantener el repo limpio desde el día 1 — commits con mensajes claros.
