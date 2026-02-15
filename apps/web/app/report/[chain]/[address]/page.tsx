'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

interface Signal {
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  description: string
  evidenceLinks: string[]
}

interface AnalysisReport {
  chain: string
  address: string
  riskScore: number
  riskTier: 'extreme' | 'high' | 'medium' | 'low'
  signals: Signal[]
  contractAnalysis: {
    isProxy: boolean
    verified: boolean
    privilegeFlags: Array<{ name: string; selector: string; riskLevel: string }>
  }
  liquidityAnalysis: {
    liquidityUsd: number | null
    fdvUsd: number | null
    volume24hUsd: number | null
    pairUrl: string | null
    lowLiquidity: boolean
    suspiciousRatio: boolean
  }
  holderAnalysis: {
    holdersUnavailable: boolean
    top1Concentration: number | null
    top10Concentration: number | null
  }
  createdAt: string
  updatedAt: string
}

export default function ReportPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const chain = params.chain as string
  const address = params.address as string
  const jobId = searchParams.get('jobId')

  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(!!jobId)

  useEffect(() => {
    fetchReport()
  }, [chain, address])

  useEffect(() => {
    if (polling && jobId) {
      const interval = setInterval(() => {
        fetchReport()
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(interval)
    }
  }, [polling, jobId])

  const fetchReport = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/report/${chain}/${address}`)

      if (response.status === 404) {
        if (polling) {
          // Still processing, keep polling
          return
        }
        setError('Report not found')
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch report')
      }

      const data = await response.json()
      setReport(data)
      setPolling(false)
      setLoading(false)
    } catch (err) {
      if (!polling) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }
  }

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case 'extreme':
        return 'bg-red-600 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-white'
      case 'low':
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  if (loading || polling) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {polling ? 'Analysis in progress...' : 'Loading report...'}
          </p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Report not found'}</p>
          <a
            href="/"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <a
          href="/"
          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-6"
        >
          ← Back to Home
        </a>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Risk Analysis Report
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                {chain} / {address}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-2">{report.riskScore}</div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(report.riskTier)}`}>
                {report.riskTier.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Signals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Risk Signals</h2>
          <div className="space-y-4">
            {report.signals.map((signal, idx) => (
              <div
                key={idx}
                className={`border-l-4 p-4 rounded ${getSeverityColor(signal.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {signal.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {signal.description}
                    </p>
                    {signal.evidenceLinks.length > 0 && (
                      <div className="mt-2">
                        {signal.evidenceLinks.map((link, linkIdx) => (
                          <a
                            key={linkIdx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mr-3"
                          >
                            View Evidence →
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="ml-4 px-2 py-1 text-xs font-semibold rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {signal.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Contract Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contract Analysis</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Verified</span>
                <span className={report.contractAnalysis.verified ? 'text-green-600' : 'text-red-600'}>
                  {report.contractAnalysis.verified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Proxy Contract</span>
                <span className={report.contractAnalysis.isProxy ? 'text-orange-600' : 'text-green-600'}>
                  {report.contractAnalysis.isProxy ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Privilege Flags</span>
                <span className="text-gray-900 dark:text-white">
                  {report.contractAnalysis.privilegeFlags.length}
                </span>
              </div>
            </div>
          </div>

          {/* Liquidity Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Liquidity Analysis</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Liquidity (USD)</span>
                <span className="text-gray-900 dark:text-white">
                  {report.liquidityAnalysis.liquidityUsd
                    ? `$${report.liquidityAnalysis.liquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">FDV (USD)</span>
                <span className="text-gray-900 dark:text-white">
                  {report.liquidityAnalysis.fdvUsd
                    ? `$${report.liquidityAnalysis.fdvUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">24h Volume</span>
                <span className="text-gray-900 dark:text-white">
                  {report.liquidityAnalysis.volume24hUsd
                    ? `$${report.liquidityAnalysis.volume24hUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Holder Analysis */}
        {!report.holderAnalysis.holdersUnavailable && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Holder Analysis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Top 1 Concentration</span>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {report.holderAnalysis.top1Concentration?.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Top 10 Concentration</span>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {report.holderAnalysis.top10Concentration?.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Analysis Timeline</h2>
          <p className="text-gray-600 dark:text-gray-400 italic">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
