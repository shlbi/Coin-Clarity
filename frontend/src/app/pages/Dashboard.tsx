import { useQuery } from '@tanstack/react-query';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { TokenRow } from '../components/TokenRow';
import { mockDashboardStats, mockRecentTokens, mockAnalysisReport } from '../../lib/mockData';
import { getPrice, getReport, Chain } from '../../lib/api';

// Custom hook to fetch price for a token
function useTokenPrice(chain: Chain, address: string, fallbackPrice: number, fallbackChange: number) {
  return useQuery({
    queryKey: ['price', chain, address],
    queryFn: () => getPrice(chain, address),
    refetchInterval: 1000, // Update every 1 second
    staleTime: 0,
    gcTime: 0, // No caching
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    initialData: { priceUsd: fallbackPrice, change24hPct: fallbackChange },
  });
}

// Custom hook to fetch risk score for a token
function useTokenRiskScore(chain: Chain, address: string, fallbackScore: number) {
  return useQuery({
    queryKey: ['report', chain, address],
    queryFn: () => getReport(chain, address, { throwOn404: false }),
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function Dashboard() {
  // Token addresses
  const tokens = [
    { chain: 'ethereum' as Chain, address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', fallbackPrice: 8.42, fallbackChange: 2.34, fallbackScore: 18 },
    { chain: 'ethereum' as Chain, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', fallbackPrice: 64250.0, fallbackChange: -1.23, fallbackScore: 12 },
    { chain: 'ethereum' as Chain, address: '0x514910771af9ca656af840dff83e8264ecf986ca', fallbackPrice: 15.67, fallbackChange: 5.12, fallbackScore: 22 },
    { chain: 'ethereum' as Chain, address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', fallbackPrice: 287.45, fallbackChange: -0.87, fallbackScore: 25 },
    { chain: 'ethereum' as Chain, address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', fallbackPrice: 0.00000842, fallbackChange: 12.45, fallbackScore: 68 },
  ];

  // Fetch real-time prices and risk scores for all tokens
  const queries = tokens.map(token => ({
    price: useTokenPrice(token.chain, token.address, token.fallbackPrice, token.fallbackChange),
    riskScore: useTokenRiskScore(token.chain, token.address, token.fallbackScore),
    token,
  }));

  // Combine mock token data with real-time prices and risk scores
  const tokensWithData = mockRecentTokens.map((tokenData, index) => {
    const query = queries[index];
    const priceData = query.price.data || { priceUsd: query.token.fallbackPrice, change24hPct: query.token.fallbackChange };
    const report = query.riskScore.data;
    const riskScore = report?.riskScore ?? query.token.fallbackScore;
    
    return {
      ...tokenData,
      price: priceData.priceUsd,
      change24h: priceData.change24hPct,
      riskScore,
    };
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1400px] px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Tokens Scanned (24h)"
            value={mockDashboardStats.tokensScanned24h.toLocaleString()}
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            label="High Risk Tokens (24h)"
            value={mockDashboardStats.highRiskTokens24h.toLocaleString()}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            label="Market Sentiment"
            value={mockDashboardStats.marketSentiment}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recently Analyzed Tokens */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827]">
                  Recently Analyzed Tokens
                </h2>
              </div>
              <div>
                {tokensWithData.map((tokenData, index) => (
                  <TokenRow
                    key={`${tokenData.token.address}-${index}`}
                    token={tokenData.token}
                    price={tokenData.price}
                    change24h={tokenData.change24h}
                    riskScore={tokenData.riskScore}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Risk Intelligence Panel */}
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
              <h3 className="font-semibold text-[#111827] mb-4">
                Top Risk Signals
              </h3>
              <div className="space-y-3">
                {mockAnalysisReport.signals.slice(0, 3).map((signal, index) => (
                  <div key={`${signal.title}-${index}`} className="pb-3 border-b border-[#E5E7EB] last:border-0 last:pb-0">
                    <h4 className="text-sm font-medium text-[#111827] mb-1">
                      {signal.title}
                    </h4>
                    <p className="text-xs text-[#6B7280] line-clamp-2">
                      {signal.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
