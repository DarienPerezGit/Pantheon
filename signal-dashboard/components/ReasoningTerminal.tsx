'use client'

import { useEffect, useRef, useState } from 'react'

export function ReasoningTerminal({ reasoning }: { reasoning: string }) {
  const [displayed,   setDisplayed]   = useState('')
  const [showCursor,  setShowCursor]  = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!reasoning) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setDisplayed('')
    setShowCursor(true)
    let i = 0

    function tick() {
      if (i < reasoning.length) {
        setDisplayed(reasoning.slice(0, ++i))
        timerRef.current = setTimeout(tick, 18)
      } else {
        setShowCursor(false)
        timerRef.current = setTimeout(() => setShowCursor(true), 800)
      }
    }
    tick()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [reasoning])

  return (
    <section className="pt-12">
      <div className="border border-space-line bg-space-dark p-7 relative overflow-hidden">
        <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-accent to-transparent" />
        <div className="flex items-center justify-between mb-5">
          <p className="section-label mb-0">LLM Reasoning</p>
          <span className="font-mono text-[10px] text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5">
            groq / llama-3.1-8b-instant
          </span>
        </div>
        <p className="font-mono text-sm text-muted leading-relaxed min-h-[60px]">
          {displayed || <span className="text-subtle">Waiting for signal...</span>}
          {showCursor && (
            <span className="inline-block w-0.5 h-[1em] bg-accent ml-0.5 align-text-bottom animate-blink" />
          )}
        </p>
      </div>
    </section>
  )
}
