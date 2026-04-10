# Prompt para Agente de Implementación

## Instrucción principal

Sos un agente de software senior. Tu tarea es implementar **Signal Agent Marketplace**, un proyecto para el hackathon "Stellar Hacks: Agents" con deadline el 13 de abril de 2026.

Lee el archivo `CONTEXT.md` en su totalidad antes de escribir una sola línea de código. Ese archivo contiene la arquitectura, el scope, el plan de 4 días, y todos los recursos necesarios.

---

## Tu objetivo del día 1

Implementar el flujo x402 end-to-end funcional con estas dos piezas:

### 1. Signal API (Go)
Un servidor HTTP en Go que:
- Expone `GET /signal?pair=BTC-USDC`
- Implementa middleware x402:
  - Sin header de pago → responde `402` con instrucciones JSON
  - Con header `X-Payment: <tx_hash>` → verifica la transacción en Horizon testnet
  - Si el pago es válido → retorna una señal generada (puede ser mock por ahora)
- Expone `GET /health` para verificar que el server está vivo

### 2. Consumer Agent (Python)
Un script Python que:
- Llama a `GET /signal`
- Maneja el 402 automáticamente: lee las instrucciones, construye y firma una transacción XLM en Stellar testnet, y reintenta con el tx hash
- Loggea cada paso claramente: `[PAYMENT]`, `[SIGNAL]`, `[DECISION]`
- Usa `stellar-sdk` para firmar y enviar la transacción

---

## Restricciones de scope — NO implementar hoy

- Sin Soroban
- Sin frontend
- Sin base de datos
- Sin múltiples agentes
- Sin Claude API todavía (las señales pueden ser mock por ahora)
- Sin trades reales

---

## Stack

- Signal API: **Go** con `net/http` estándar + `github.com/stellar/go` SDK
- Consumer Agent: **Python** con `stellar-sdk` y `requests`
- Red: **Stellar testnet** (`https://horizon-testnet.stellar.org`)
- Config: variables de entorno desde `.env`

---

## Variables de entorno disponibles (ya configuradas)

```
SERVER_PUBLIC_KEY=...
SERVER_SECRET_KEY=...
CONSUMER_PUBLIC_KEY=...
CONSUMER_SECRET_KEY=...
HORIZON_URL=https://horizon-testnet.stellar.org
SIGNAL_PRICE_XLM=0.10
STELLAR_NETWORK=testnet
```

---

## Estructura de carpetas a crear

```
signal-agent-marketplace/
├── .env                  # (ya existe, no tocar)
├── .env.example          # crear con keys vacías
├── README.md             # crear con descripción básica
├── signal-api/
│   ├── main.go
│   ├── go.mod
│   └── go.sum
└── consumer-agent/
    ├── agent.py
    ├── wallet.py
    └── x402_client.py
```

---

## Definition of Done para hoy

El siguiente flujo debe funcionar de punta a punta sin errores:

```bash
# Terminal 1
cd signal-api && go run main.go
# → Server escuchando en :8080

# Terminal 2
cd consumer-agent && python agent.py
# → [REQUEST] GET /signal?pair=BTC-USDC
# → [402] Payment required: 0.10 XLM → GABCD...
# → [PAYMENT] Enviando tx...
# → [PAYMENT] TX confirmada: abc123...
# → [REQUEST] Reintentando con X-Payment: abc123...
# → [SIGNAL] BUY | confidence: 0.72 | pair: BTC-USDC
# → [DECISION] Señal recibida. Acción: BUY
```

El tx hash debe ser verificable en:
`https://stellar.expert/explorer/testnet/tx/<TX_HASH>`

---

## Notas importantes

- Manejá errores en todos los pasos de red (Horizon puede tardar)
- El memo de la transacción debe ser `signal-<pair>` (ej: `signal-btc-usdc`)
- La verificación en el server debe chequear: destinatario correcto, monto >= precio, memo correcto
- Usá polling en el consumer para esperar confirmación antes de reintentar (~5 segundos en testnet)
- Todos los logs deben incluir timestamp

Arrancá leyendo `CONTEXT.md` y luego implementá en orden: Signal API → Consumer Agent → prueba end-to-end.
