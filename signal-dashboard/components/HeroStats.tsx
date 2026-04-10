'use client'

import type { AgentState, SignalType } from '@/lib/types'

function sigColor(s: SignalType) {
  if (s === 'BUY')  return 'text-neon-green'
  if (s === 'SELL') return 'text-crimson'
  return 'text-grey-signal'
}

export function HeroStats({ state }: { state: AgentState }) {
  const colorCls = sigColor(state.last_signal)

  return (
    <section className="pt-12">
      <p className="section-label">Agent Status</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-space-line">

        {/* Cycles */}
        <div className="pb-9 sm:pb-0 sm:pr-12">
          <p className="stat-label">Total Cycles</p>
          <p className="stat-number">{state.cycle}</p>
          <p className="stat-unit">Completed</p>
          <p className="mt-2 font-mono text-[10px] text-subtle">
            {state.updated_at ? `Last: ${state.updated_at}` : 'Waiting...'}
          </p>
        </div>

        {/* Signal */}
        <div className="py-9 sm:py-0 sm:px-12">
          <p className="stat-label">Current Signal</p>
          <p className={`stat-number transition-colors duration-300 ${colorCls}`}>
            {state.last_signal}
          </p>
          <p className="stat-unit">{state.pair}</p>
          <p className="mt-2 font-mono text-[10px] text-subtle">
            {state.signal_price} XLM / signal
          </p>
        </div>

        {/* Confidence */}
        <div className="pt-9 sm:pt-0 sm:pl-12">
          <p className="stat-label">Confidence Score</p>
          <p className={`stat-number transition-colors duration-300 ${colorCls}`}>
            {state.confidence > 0 ? `${(state.confidence * 100).toFixed(1)}%` : '--'}
          </p>
          <p className="stat-unit">Claude / claude-sonnet-4</p>
          <p className="mt-2 font-mono text-[10px] text-subtle truncate" title={state.server_wallet}>
            {state.server_wallet ? `${state.server_wallet.slice(0, 12)}...${state.server_wallet.slice(-6)}` : ''}
          </p>
        </div>

      </div>
    </section>
  )
}
