'use client'

import { useAgentState }       from '@/hooks/useAgentState'
import { Header }              from '@/components/Header'
import { HeroStats }           from '@/components/HeroStats'
import { CycleVisualizer }     from '@/components/CycleVisualizer'
import { ReasoningTerminal }   from '@/components/ReasoningTerminal'
import { TransactionTable }    from '@/components/TransactionTable'

export default function Page() {
  const { state, flowStep, error } = useAgentState()

  return (
    <main className="max-w-[1160px] mx-auto px-10 pb-20">
      <Header error={error} />

      <HeroStats state={state} />
      <div className="h-px bg-space-line mt-12" />

      <CycleVisualizer flowStep={flowStep} />
      <div className="h-px bg-space-line mt-12" />

      <ReasoningTerminal reasoning={state.reasoning} />
      <div className="h-px bg-space-line mt-12" />

      <TransactionTable txLog={state.tx_log} latestCycle={state.cycle} />
      <div className="h-px bg-space-line mt-12" />

      <footer className="flex items-center justify-between pt-6 text-[11px] text-subtle">
        <span className="font-mono">{state.pair} · polling every 5s</span>
        <span className="font-mono">
          Total cycles: <span className="text-accent font-semibold">{state.cycle}</span>
        </span>
      </footer>
    </main>
  )
}
