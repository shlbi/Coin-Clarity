import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import {
  Chain,
  analyzeToken,
  getReport,
  getPrice,
  formatPrice,
  formatPercent,
  formatLargeNumber,
  AnalysisReport,
} from '../../lib/api';
import { RiskScorePanel } from '../components/RiskScorePanel';
import { SignalsList } from '../components/SignalsList';
import { MetricsGrid } from '../components/MetricsGrid';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export function TokenReport() {
  const { chain, address } = useParams<{ chain: Chain; address: string }>();
  const queryClient = useQueryClient();

  // Fetch or trigger analysis
  const { data: reportData, isLoading, error } = useQuery<AnalysisReport>({
    queryKey: ['report', chain, address],
    queryFn: async () => {
      const result = await getReport(chain!, address!);
      if (result === null) {
        throw new Error('Report not found');
      }
      return result;
    },
    enabled: !!chain && !!address,
    retry: (failureCount, error) => {
      // Don't retry on 404, but retry on other errors
      if (error instanceof Error && error.message === 'Report not found') {
        return false;
      }
      return failureCount < 2;
    },
    onError: (err) => {
      console.error('Error fetching report:', err);
    },
  });

  // Analyze mutation - triggers when report not found
  const analyzeMutation = useMutation({
    mutationFn: () => analyzeToken(chain!, address!),
    onSuccess: (data) => {
      console.log('Analysis response:', data);
      if (data.status === 'completed') {
        // Report is ready, refetch
        queryClient.invalidateQueries({ queryKey: ['report', chain, address] });
      } else if (data.status === 'processing') {
        console.log('Analysis processing, will poll for results...');
      }
    },
    onError: (err) => {
      console.error('Analysis mutation error:', err);
    },
  });

  // Poll for report when analysis is processing
  const shouldPoll = analyzeMutation.data?.status === 'processing';
  const { data: polledReport, error: pollError } = useQuery<AnalysisReport | null>({
    queryKey: ['report-poll', chain, address],
    queryFn: async () => {
      try {
        return await getReport(chain!, address!, { throwOn404: false });
      } catch (err) {
        // During polling, any error should return null to keep polling
        console.debug('Polling: report not ready yet');
        return null;
      }
    },
    enabled: shouldPoll && !!chain && !!address,
    refetchInterval: (query) => {
      // Keep polling if we don't have data yet (null means 404, which is expected)
      const hasData = query.state.data !== null && query.state.data !== undefined;
      return hasData ? false : 2000; // Poll every 2s until we get data
    },
    retry: false,
    // Suppress error logging during polling
    throwOnError: false,
    onError: () => {
      // Silently handle errors during polling - 404s are expected
    },
  });

  // Price data - refresh every 5 seconds for real-time updates
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);
  const priceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: priceData = { priceUsd: 0, change24hPct: 0 }, isFetching } = useQuery({
    queryKey: ['price', chain, address],
    queryFn: () => {
      console.log(`[Price] Fetching for ${chain}/${address}...`);
      return getPrice(chain!, address!);
    },
    enabled: !!chain && !!address,
    refetchInterval: 1000, // Update every 1 second
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache (gcTime replaces cacheTime in React Query v5)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    onSuccess: (data) => {
      console.log(`[Price] Received: $${data.priceUsd}, change: ${data.change24hPct}%`);
      if (previousPrice !== null && data.priceUsd !== previousPrice && data.priceUsd > 0) {
        const direction = data.priceUsd > previousPrice ? 'up' : 'down';
        console.log(`[Price] Change detected: ${previousPrice} -> ${data.priceUsd} (${direction})`);
        setPriceChange(direction);
        // Clear the highlight after 2 seconds
        if (priceTimeoutRef.current) {
          clearTimeout(priceTimeoutRef.current);
        }
        priceTimeoutRef.current = setTimeout(() => {
          setPriceChange(null);
        }, 2000);
      }
      if (data.priceUsd > 0) {
        setPreviousPrice(data.priceUsd);
      }
    },
  });
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (priceTimeoutRef.current) {
        clearTimeout(priceTimeoutRef.current);
      }
    };
  }, []);

  // Trigger analysis if report not found
  useEffect(() => {
    if (error instanceof Error && error.message === 'Report not found' && !analyzeMutation.isPending && !analyzeMutation.isSuccess) {
      console.log('Report not found, triggering analysis...');
      analyzeMutation.mutate();
    }
  }, [error, analyzeMutation]);

  // Use polled report if available (filter out null from polling)
  const report = (polledReport && polledReport !== null) ? polledReport : reportData;

  if (!chain || !address) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-[#6B7280]">Invalid token parameters</p>
      </div>
    );
  }

  // Show loading state
  const isInitialLoading = isLoading && !error;
  const isAnalyzing = analyzeMutation.isPending || (shouldPoll && !polledReport);
  
  if (isInitialLoading || isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Show error state (but not for "Report not found" as we're handling that)
  if (error && error instanceof Error && error.message !== 'Report not found' && !isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#DC2626] mb-2">Error loading report</p>
          <p className="text-sm text-[#6B7280] mb-4">{error.message}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If we still don't have a report after all attempts, show message
  if (!report) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#111827] mb-2">Analysis in progress</p>
          <p className="text-sm text-[#6B7280] mb-4">
            The token analysis is being processed. Please wait...
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const token = report.token || { chain: report.chain as Chain, address: report.address };
  const metrics = report.metrics || {
    liquidityUsd: report.liquidityAnalysis?.liquidityUsd ?? null,
    fdvUsd: report.liquidityAnalysis?.fdvUsd ?? null,
    volume24hUsd: report.liquidityAnalysis?.volume24hUsd ?? null,
    top10HolderPct: report.holderAnalysis?.top10Concentration ?? null,
    top1HolderPct: report.holderAnalysis?.top1Concentration ?? null,
    verified: report.contractAnalysis?.verified ?? false,
    isProxy: report.contractAnalysis?.isProxy ?? false,
    pairUrl: report.liquidityAnalysis?.pairUrl ?? null,
  };

  const tokenName = token.name || token.symbol || `${chain.charAt(0).toUpperCase() + chain.slice(1)} Token`;
  const isPositive = priceData.change24hPct >= 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1400px] px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-semibold text-[#111827]">{tokenName}</h1>
                <span className="px-3 py-1 bg-[#F8FAFC] text-[#6B7280] text-sm rounded capitalize">
                  {chain}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <code className="text-sm text-[#6B7280] font-mono">{address}</code>
                <a
                  href={`https://${chain === 'ethereum' ? 'etherscan.io' : 'basescan.org'}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-[#6B7280] mb-1">Price</p>
                  <p 
                    className={`text-xl font-semibold transition-all duration-300 ${
                      priceChange === 'up' 
                        ? 'text-[#16A34A] scale-105' 
                        : priceChange === 'down' 
                        ? 'text-[#DC2626] scale-105' 
                        : priceData.change24hPct >= 0
                        ? 'text-[#16A34A]'
                        : 'text-[#DC2626]'
                    }`}
                  >
                    {formatPrice(priceData.priceUsd)}
                  </p>
                  <p className={`text-sm ${isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {formatPercent(priceData.change24hPct)}
                  </p>
                </div>

                {metrics.liquidityUsd && (
                  <div>
                    <p className="text-sm text-[#6B7280] mb-1">Liquidity</p>
                    <p className="text-xl font-semibold text-[#111827]">
                      {formatLargeNumber(metrics.liquidityUsd)}
                    </p>
                  </div>
                )}

                {metrics.fdvUsd && (
                  <div>
                    <p className="text-sm text-[#6B7280] mb-1">FDV</p>
                    <p className="text-xl font-semibold text-[#111827]">
                      {formatLargeNumber(metrics.fdvUsd)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full lg:w-80">
              <RiskScorePanel score={report.riskScore} tier={report.riskTier} />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#111827] mb-4">Risk Signals</h2>
          <SignalsList signals={report.signals} />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#111827] mb-4">Token Metrics</h2>
          <MetricsGrid metrics={metrics} />
        </div>

        {report.updatedAt && (
          <div className="mt-8 text-center text-sm text-[#6B7280]">
            Last updated: {new Date(report.updatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
