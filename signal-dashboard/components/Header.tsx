'use client'

interface Props { error: string | null }

export function Header({ error }: Props) {
  return (
    <header className="flex items-start justify-between py-9 border-b border-space-line">
      <div>
        <p className="text-lg font-black tracking-[0.18em] uppercase text-accent leading-none">
          PANTHEON
        </p>
        <p className="mt-1.5 text-[11px] tracking-[0.06em] text-subtle uppercase">
          Autonomous Signal Agent · x402 Protocol on Stellar
        </p>
      </div>
      <div className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.12em] uppercase text-muted">
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${error ? 'bg-crimson' : 'bg-neon-green'}`} />
        {error ? `ERROR · ${error}` : 'LIVE · STELLAR TESTNET'}
      </div>
    </header>
  )
}
