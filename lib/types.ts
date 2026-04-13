// Types shared across the dashboard — mirrors the Go AgentState struct

export type SignalType = 'BUY' | 'SELL' | 'HOLD' | '—'

export interface TxEntry {
  time:   string
  cycle:  number
  amount: string
  hash:   string
  pair:   string
  signal: string
}

/** Shape returned by GET http://localhost:8080/state */
export interface AgentState {
  cycle:         number
  last_signal:   SignalType
  confidence:    number
  reasoning:     string
  pair:          string
  server_wallet: string
  signal_price:  string
  updated_at:    string
  tx_log:        TxEntry[]
}

export const CONSUMER_WALLET = 'GDYJ5LX3Q5LVSZ3GXWIGEZP22VPRXEK4IWJGJVDF5M6WJIEHF3ZK4NDS'
export const HORIZON_EXPLORER = 'https://stellar.expert/explorer/testnet/tx/'

export const INITIAL_STATE: AgentState = {
  cycle:         0,
  last_signal:   '—',
  confidence:    0,
  reasoning:     '',
  pair:          'BTC-USDC',
  server_wallet: '',
  signal_price:  '0.10',
  updated_at:    '',
  tx_log:        [],
}
