'use client'

const STEPS = [
  { icon: '\u27f6', label: 'Request',        sub: 'GET /signal'       },
  { icon: '\u26a1', label: '402 Required',   sub: '0.10 USDC'          },
  { icon: '\u2726',  label: 'Pay on Stellar', sub: 'Horizon TX'        },
  { icon: '\u25c8',  label: 'Verify',         sub: 'Horizon API'       },
  { icon: '\u25c9',  label: 'Signal',          sub: 'BUY / SELL / HOLD' },
]

export function CycleVisualizer({ flowStep }: { flowStep: number }) {
  return (
    <section className="pt-12">
      <p className="section-label text-gray-500">x402 Cycle</p>
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
                  isActive ? 'bg-gray-900' : isDone ? 'bg-gray-400' : 'bg-gray-200',
                ].join(' ')} />
              )}
              {/* icon box */}
              <div className={[
                'relative z-10 w-10 h-10 flex items-center justify-center border text-base transition-all duration-300',
                isActive ? 'border-gray-900 bg-gray-100' : isDone ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-white',
              ].join(' ')}>
                {step.icon}
              </div>
              {/* step label */}
              <p className={[
                'text-[10px] font-semibold tracking-[0.08em] uppercase text-center max-w-[80px] leading-snug transition-colors duration-300',
                isActive ? 'text-gray-900' : isDone ? 'text-gray-400' : 'text-gray-300',
              ].join(' ')}>
                {step.label}
              </p>
              {/* sub label */}
              <p className={[
                'font-mono text-[9px] text-center max-w-[80px] leading-snug transition-colors duration-300',
                isActive ? 'text-gray-900' : 'text-gray-400',
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
