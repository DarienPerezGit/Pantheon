import Link from 'next/link'
import Image from 'next/image'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">Pantheon</div>
          <div className="flex gap-8 items-center">
            <a
              href="https://github.com/DarienPerezGit/Pantheon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/demo"
              className="text-sm px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              View Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 py-32">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-6xl font-light tracking-tight mb-6" style={{ fontFamily: 'system-ui' }}>
              Autonomous agents that pay for data.
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              HTTP 402 as a protocol for agent-to-agent micropayments. No smart contracts.
              Stellar USDC. Real payments, real settlement.
            </p>
            <div className="flex gap-4">
              <Link
                href="/demo"
                className="px-6 py-3 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                View Demo
              </Link>
              <a
                href="https://github.com/DarienPerezGit/Pantheon"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border border-gray-300 text-black rounded text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center md:justify-end w-full max-w-md">
            <Image
              src="/hero.webp"
              alt="Pantheon Hero"
              width={400}
              height={400}
              className="rounded-xl shadow-xl object-contain w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-200" />

      {/* Problem */}
      <section className="max-w-6xl mx-auto px-8 py-24">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-light tracking-tight mb-12">
            Today's agent infrastructure stops at execution.
          </h2>
          <div className="space-y-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Agents can iterate. Agents can decide. Agents can act. But agents cannot pay.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              APIs are monetized for humans: accounts, subscriptions, keys. Not for autonomy.
              Not for real commerce.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed font-medium">
              The missing layer: payment as a first-class primitive.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-200" />

      {/* Solution */}
      <section className="max-w-6xl mx-auto px-8 py-24">
        <h2 className="text-4xl font-light tracking-tight mb-16">HTTP 402 Payment Required</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="space-y-6 font-mono text-sm bg-gray-50 p-8 rounded border border-gray-200">
              <div>
                <span className="text-gray-500">Agent:</span>
                <span className="ml-2">GET /signal</span>
              </div>
              <div>
                <span className="text-gray-500">API:</span>
                <span className="ml-2">402 Payment Required</span>
              </div>
              <div>
                <span className="text-gray-500">Agent:</span>
                <span className="ml-2">Pay 0.10 USDC on Stellar</span>
              </div>
              <div>
                <span className="text-gray-500">Agent:</span>
                <span className="ml-2">Retry with tx hash</span>
              </div>
              <div>
                <span className="text-gray-500">API:</span>
                <span className="ml-2">200 OK + signal data</span>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              When an agent needs premium data, the API responds with payment instructions.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              The agent atomically pays on Stellar, retries with proof, and receives the data.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed font-medium">
              This is not aspirational. It works today.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-200" />

      {/* Proof */}
      <section className="max-w-6xl mx-auto px-8 py-24">
        <h2 className="text-4xl font-light tracking-tight mb-12">Real payments, verified on-chain.</h2>

        <div className="space-y-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            Pantheon already executes real micropayments on Stellar testnet.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded p-8 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-2">Consumer Wallet</p>
                <p className="font-mono text-sm text-gray-900">GDYJ5...xxx</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Server Wallet</p>
                <p className="font-mono text-sm text-gray-900">GBZW...xxx</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-300">
              <p className="text-sm text-gray-600 mb-3">Completed Transactions</p>
              <p className="text-2xl font-light text-black">20+ verified payments</p>
            </div>
          </div>

          <a
            href="https://stellar.expert/explorer/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View on Stellar Expert →
          </a>

          <p className="text-sm text-gray-600 italic">
            This is production infrastructure. Not a prototype.
          </p>
        </div>
      </section>

      <div className="border-t border-gray-200" />

      {/* Why Stellar */}
      <section className="max-w-6xl mx-auto px-8 py-24">
        <h2 className="text-4xl font-light tracking-tight mb-12">Why Stellar?</h2>

        <p className="text-lg text-gray-700 leading-relaxed mb-12 max-w-2xl">
          Stellar isn't fashionable. It's practical.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">Finality</p>
            <p className="text-2xl font-light text-black">~5 seconds</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">Transaction Fees</p>
            <p className="text-2xl font-light text-black">Sub-cent</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">Native Stablecoin</p>
            <p className="text-2xl font-light text-black">USDC built-in</p>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">Protocol Design</p>
            <p className="text-2xl font-light text-black">For payments</p>
          </div>
        </div>

        <p className="text-lg text-gray-700 leading-relaxed mt-12">
          Perfect for agent micropayments.
        </p>
      </section>

      <div className="border-t border-gray-200" />

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-8 py-32">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-light tracking-tight mb-8">
            Start building payment-native agent APIs.
          </h2>

          <p className="text-lg text-gray-600 mb-12 leading-relaxed">
            Pantheon is a reference implementation of HTTP 402 on Stellar. Open source. Deploy
            locally. Build on top.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="https://github.com/DarienPerezGit/Pantheon"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors text-center"
            >
              GitHub Repository
            </a>
            <Link
              href="/demo"
              className="px-6 py-3 border border-gray-300 text-black rounded text-sm font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Run Locally
            </Link>
            <a
              href="https://github.com/DarienPerezGit/Pantheon#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-gray-300 text-black rounded text-sm font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Quick Start
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>Pantheon · HTTP 402 on Stellar</p>
            <a
              href="https://github.com/DarienPerezGit/Pantheon"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
