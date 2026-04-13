'use client'

import type { AgentState, SignalType } from '@/lib/types'

function sigColor(s: SignalType) {
  return 'text-black';
}

export function HeroStats({ state }: { state: AgentState }) {
  const colorCls = sigColor(state.last_signal)

  return (
    <section className="pt-12">
      <p className="section-label text-gray-500">Agent Status</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">

        {/* Cycles */}
        <div className="pb-9 sm:pb-0 sm:pr-12">
          <p className="stat-label text-gray-500">Total Cycles</p>
          <p className="stat-number text-black">{state.cycle}</p>
          <p className="stat-unit text-gray-400">Completed</p>
          <p className="mt-2 font-mono text-[10px] text-gray-400">
            {state.updated_at ? `Last: ${state.updated_at}` : 'Waiting...'}
          </p>
        </div>

        {/* Signal */}
        <div className="py-9 sm:py-0 sm:px-12">
          <p className="stat-label text-gray-500">Current Signal</p>
          <p className={`stat-number ${colorCls}`}>{state.last_signal}</p>
          <p className="stat-unit text-gray-400">{state.pair}</p>
          <p className="mt-2 font-mono text-[10px] text-gray-400">
            {state.signal_price} USDC / signal
          </p>
        </div>

        {/* Confidence */}
        <div className="pt-9 sm:pt-0 sm:pl-12">
          <p className="stat-label text-gray-500">Confidence Score</p>
          <p className={`stat-number ${colorCls}`}>{state.confidence > 0 ? `${(state.confidence * 100).toFixed(1)}%` : '--'}</p>
          <p className="stat-unit text-gray-400">Claude / claude-sonnet-4</p>
          <p className="mt-2 font-mono text-[10px] text-gray-400 truncate" title={state.server_wallet}>
            {state.server_wallet ? `${state.server_wallet.slice(0, 12)}...${state.server_wallet.slice(-6)}` : ''}
          </p>
        </div>

      </div>
    </section>
  )
}
