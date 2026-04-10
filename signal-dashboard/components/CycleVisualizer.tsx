'use client'

const STEPS = [
  { icon: '\u27f6', label: 'Request',        sub: 'GET /signal'       },
  { icon: '\u26a1', label: '402 Required',   sub: '0.10 XLM'          },
  { icon: '\u2726',  label: 'Pay on Stellar', sub: 'Horizon TX'        },
  { icon: '\u25c8',  label: 'Verify',         sub: 'Horizon API'       },
  { icon: '\u25c9',  label: 'Signal',          sub: 'BUY / SELL / HOLD' },
]

export function CycleVisualizer({ flowStep }: { flowStep: number }) {
  return (
    <section className="pt-12">
      <p className="section-label">x402 Cycle</p>
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const isActive = flowStep === i
          const isDone   = flowStep > i && flowStep !== -1
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2.5 relative">
              {/* connector */}
              {i < STEPS.length - 1 && (
                <span className={[
                  'absolute top-5 left-[calc(50%+20px)] right-[calc(-50%+20px)] h-px transition-all duration-300',
                  isActive ? 'bg-accent shadow-[0_0_8px_rgba(255,0,127,0.5)]'
                  : isDone  ? 'bg-accent/30'
                  : 'bg-[#2A2A36]',
                ].join(' ')} />
              )}
              {/* icon box */}
              <div className={[
                'relative z-10 w-10 h-10 flex items-center justify-center border text-base transition-all duration-300',
                isActive ? 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(255,0,127,0.2)]'
                : isDone  ? 'border-neon-green/40 bg-neon-green/5'
                : 'border-[#2A2A36] bg-space-dark',
              ].join(' ')}>
                {step.icon}
              </div>
              {/* step label */}
              <p className={[
                'text-[10px] font-semibold tracking-[0.08em] uppercase text-center max-w-[80px] leading-snug transition-colors duration-300',
                isActive ? 'text-muted' : isDone ? 'text-neon-green' : 'text-subtle',
              ].join(' ')}>
                {step.label}
              </p>
              {/* sub label */}
              <p className={[
                'font-mono text-[9px] text-center max-w-[80px] leading-snug transition-colors duration-300',
                isActive ? 'text-accent' : 'text-subtle',
              ].join(' ')}>
                {step.sub}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
