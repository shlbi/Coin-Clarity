'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Chain = 'ethereum' | 'base'

export default function Home() {
  const [chain, setChain] = useState<Chain>('ethereum')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Invalid Ethereum address format')
      setLoading(false)
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chain, address: address.toLowerCase() }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze token')
      }

      const data = await response.json()

      if (data.status === 'completed') {
        // Navigate to report page
        router.push(`/report/${chain}/${address.toLowerCase()}`)
      } else if (data.status === 'processing') {
        // Navigate to report page with polling
        router.push(`/report/${chain}/${address.toLowerCase()}?jobId=${data.jobId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Coin Clarity
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Analyze crypto tokens to detect fraud and scam risk
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="chain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blockchain
                </label>
                <select
                  id="chain"
                  value={chain}
                  onChange={(e) => setChain(e.target.value as Chain)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                </select>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contract Address
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-200"
              >
                {loading ? 'Analyzing...' : 'Analyze Token'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Enter a token contract address to get a comprehensive risk analysis</p>
          </div>
        </div>
      </div>
    </div>
  )
}
