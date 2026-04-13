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
      <div className="border border-gray-200 bg-white p-7 relative overflow-hidden">
        <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-gray-900 to-transparent" />
        <div className="flex items-center justify-between mb-5">
          <p className="section-label mb-0 text-gray-500">LLM Reasoning</p>
          <span className="font-mono text-[10px] text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-0.5">
            groq / llama-3.1-8b-instant
          </span>
        </div>
        <p className="font-mono text-sm text-gray-700 leading-relaxed min-h-[60px]">
          {displayed || <span className="text-gray-300">Waiting for signal...</span>}
          {showCursor && (
            <span className="inline-block w-0.5 h-[1em] bg-gray-900 ml-0.5 align-text-bottom animate-blink" />
          )}
        </p>
      </div>
    </section>
  )
}
