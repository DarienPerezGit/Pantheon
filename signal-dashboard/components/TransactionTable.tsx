import type { TxEntry } from '@/lib/types'
import { HORIZON_EXPLORER } from '@/lib/types'

function trunc(h: string) { return `${h.slice(0, 8)}...${h.slice(-6)}` }

function badge(sig: string) {
  return 'text-black bg-gray-100';
}

export function TransactionTable({
  txLog,
  latestCycle,
}: {
  txLog:        TxEntry[]
  latestCycle:  number
}) {
  return (
    <section className="pt-12">
      <p className="section-label text-gray-500">
        Transaction Log
        <span className="ml-2 font-normal tracking-normal text-gray-400">
          -- Stellar Testnet · last 5
        </span>
      </p>
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="border-b border-gray-200">
            {['Time','Cycle','Pair','Signal','Amount','TX Hash','Explorer'].map(h => (
              <th key={h} className="text-left pb-3.5 text-[10px] font-bold tracking-[0.15em] uppercase text-gray-400 last:text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {txLog.map((tx, i) => (
            <tr
              key={tx.hash}
              className={[
                'border-b border-gray-200 transition-colors hover:bg-gray-50',
                i === 0 && tx.cycle === latestCycle ? 'animate-fadeInRow' : '',
              ].join(' ')}
            >
              <td className="py-3.5 font-mono text-[12px] text-gray-400">{tx.time}</td>
              <td className="py-3.5 font-mono text-[12px] text-gray-400">{tx.cycle}</td>
              <td className="py-3.5 font-mono text-[12px] text-gray-400">{tx.pair}</td>
              <td className="py-3.5">
                <span className={`font-mono text-[10px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 ${badge(tx.signal)}`}>
                  {tx.signal}
                </span>
              </td>
              <td className="py-3.5 font-mono text-[13px] font-semibold text-black">{tx.amount} USDC</td>
              <td className="py-3.5 font-mono text-[12px] text-gray-400">{trunc(tx.hash)}</td>
              <td className="py-3.5 text-right">
                <a
                  href={`${HORIZON_EXPLORER}${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-stellar-blue opacity-65 hover:opacity-100 hover:text-white transition-all"
                >
                  View
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
