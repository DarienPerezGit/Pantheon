'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AgentState } from '@/lib/types'
import { INITIAL_STATE } from '@/lib/types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080'
const POLL_MS  = 5000
const STEP_MS  = [0, 400, 900, 1600, 2200] as const

export function useAgentState() {
  const [state,    setState]    = useState<AgentState>(INITIAL_STATE)
  const [flowStep, setFlowStep] = useState(-1)
  const [error,    setError]    = useState<string | null>(null)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const animateThenUpdate = useCallback((updateFn: () => void) => {
    clearTimers()
    setFlowStep(-1)
    STEP_MS.forEach((delay, i) => {
      timersRef.current.push(setTimeout(() => setFlowStep(i), delay))
    })
    timersRef.current.push(
      setTimeout(() => { updateFn(); setFlowStep(-1) }, STEP_MS[STEP_MS.length - 1] + 700)
    )
  }, [])

  const runCycle = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/state`, {
        signal: AbortSignal.timeout(4000),
        cache:  'no-store',
      })
      if (!res.ok) throw new Error(`API returned HTTP ${res.status}`)
      const data = await res.json() as AgentState
      setError(null)
      animateThenUpdate(() => setState(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API unreachable')
    }
  }, [animateThenUpdate])

  useEffect(() => {
    runCycle()
    const id = setInterval(runCycle, POLL_MS)
    return () => { clearInterval(id); clearTimers() }
  }, [runCycle])

  return { state, flowStep, error }
}
