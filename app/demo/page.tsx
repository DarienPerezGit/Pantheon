'use client'

import { useAgentState } from '@/hooks/useAgentState'
import { Header } from '@/components/Header'
import { HeroStats } from '@/components/HeroStats'
import { CycleVisualizer } from '@/components/CycleVisualizer'
import { ReasoningTerminal } from '@/components/ReasoningTerminal'
import { TransactionTable } from '@/components/TransactionTable'
import Link from 'next/link'

export default function DemoPage() {
  const { state, flowStep, error } = useAgentState()

  return (
    <main className="w-full min-h-screen bg-white text-black px-0 pb-24">
      <div className="mb-8 pl-8 pt-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to Pantheon
        </Link>
      </div>

      <div className="w-full max-w-6xl mx-auto px-8">
        <Header error={error} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-8">
        <HeroStats state={state} />
        <div className="h-px bg-gray-200 mt-12" />

        <CycleVisualizer flowStep={flowStep} />
        <div className="h-px bg-gray-200 mt-12" />

        <ReasoningTerminal reasoning={state.reasoning} />
        <div className="h-px bg-gray-200 mt-12" />

        <TransactionTable txLog={state.tx_log} latestCycle={state.cycle} />
        <div className="h-px bg-gray-200 mt-12" />
      </div>

      <footer className="w-full max-w-6xl mx-auto px-8 flex items-center justify-between pt-10 text-[11px] text-gray-400">
        <span className="font-mono">{state.pair} · polling every 5s</span>
        <span className="font-mono">
          Total cycles: <span className="text-black font-semibold">{state.cycle}</span>
        </span>
      </footer>
    </main>
  )
}
