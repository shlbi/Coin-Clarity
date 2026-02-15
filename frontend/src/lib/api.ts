// API client for CoinClarity backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export type Chain = 'ethereum' | 'base';
export type RiskTier = 'low' | 'medium' | 'high' | 'extreme';
export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Signal {
  title: string;
  severity: SignalSeverity;
  description: string;
  evidenceLinks?: string[];
}

export interface TokenMetrics {
  liquidityUsd?: number | null;
  fdvUsd?: number | null;
  volume24hUsd?: number | null;
  top10HolderPct?: number | null;
  top1HolderPct?: number | null;
  verified?: boolean;
  isProxy?: boolean;
  pairUrl?: string | null;
}

export interface Token {
  chain: Chain;
  address: string;
  name?: string;
  symbol?: string;
}

export interface AnalysisReport {
  chain: string;
  address: string;
  riskScore: number;
  riskTier: RiskTier;
  signals: Signal[];
  contractAnalysis?: {
    isProxy: boolean;
    verified: boolean;
    privilegeFlags: Array<{ name: string; selector: string; riskLevel: string }>;
  };
  liquidityAnalysis?: {
    liquidityUsd: number | null;
    fdvUsd: number | null;
    volume24hUsd: number | null;
    pairUrl: string | null;
  };
  holderAnalysis?: {
    top1Concentration: number | null;
    top10Concentration: number | null;
  };
  updatedAt?: string;
  createdAt?: string;
  // Computed properties
  token?: Token;
  metrics?: TokenMetrics;
}

export interface ProcessingStatus {
  status: 'processing';
  jobId: string;
}

export interface PriceData {
  priceUsd: number;
  change24hPct: number;
}

export type AnalyzeResponse = 
  | { status: 'completed'; report: AnalysisReport }
  | ProcessingStatus;

// API functions
export async function analyzeToken(
  chain: Chain,
  address: string
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chain, address: address.toLowerCase() }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(error.detail || `Analysis failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status === 'completed' && data.report) {
    return {
      status: 'completed',
      report: transformReport(data.report),
    };
  }
  
  return data;
}

export async function getReport(
  chain: Chain,
  address: string,
  options?: { throwOn404?: boolean }
): Promise<AnalysisReport | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/report/${chain}/${address.toLowerCase()}`);

    if (!response.ok) {
      if (response.status === 404) {
        // If throwOn404 is false, return null instead of throwing (for polling)
        if (options?.throwOn404 === false) {
          return null;
        }
        throw new Error('Report not found');
      }
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch report' }));
      throw new Error(error.detail || `Failed to fetch report: ${response.statusText}`);
    }

    const data = await response.json();
    return transformReport(data);
  } catch (error) {
    // If throwOn404 is false and it's a 404, return null
    if (options?.throwOn404 === false && error instanceof Error && error.message === 'Report not found') {
      return null;
    }
    throw error;
  }
}

export async function getPrice(
  chain: Chain,
  address: string
): Promise<PriceData> {
  // Fetch price from DexScreener directly (public API, no key needed)
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${address.toLowerCase()}`;
    const response = await fetch(url, {
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      console.warn(`DexScreener API error: ${response.status}`);
      return { priceUsd: 0, change24hPct: 0 };
    }
    
    const data = await response.json();
    const pairs = data.pairs || [];
    
    if (pairs.length === 0) {
      console.warn('No pairs found in DexScreener response');
      return { priceUsd: 0, change24hPct: 0 };
    }
    
    // Find the pair with the highest liquidity
    const primary = pairs.reduce((best: any, p: any) => {
      const liq = parseFloat(p.liquidity?.usd || '0');
      const bestLiq = parseFloat(best.liquidity?.usd || '0');
      return liq > bestLiq ? p : best;
    }, pairs[0]);
    
    const price = parseFloat(primary.priceUsd || '0');
    const change24h = parseFloat(primary.priceChange?.h24 || '0');
    
    // Return 0 if price is invalid
    if (isNaN(price) || price <= 0) {
      console.warn('Invalid price from DexScreener:', primary.priceUsd);
      return { priceUsd: 0, change24hPct: 0 };
    }
    
    return {
      priceUsd: price,
      change24hPct: isNaN(change24h) ? 0 : change24h,
    };
  } catch (error) {
    console.error('Error fetching price from DexScreener:', error);
    return { priceUsd: 0, change24hPct: 0 };
  }
}

// Utility functions
export function isEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function extractAddressFromUrl(url: string): string | null {
  const match = url.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

export function getRiskColor(score: number): string {
  if (score <= 30) return '#16A34A';
  if (score <= 59) return '#CA8A04';
  if (score <= 79) return '#EA580C';
  return '#DC2626';
}

export function formatPrice(price: number): string {
  if (price === 0) return '$0.00';
  if (price >= 1) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

export function formatPercent(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

// Transform backend report to frontend format
function transformReport(backendReport: any): AnalysisReport {
  const riskTier = (backendReport.riskTier || backendReport.risk_tier || 'low').toLowerCase() as RiskTier;
  
  const report: AnalysisReport = {
    chain: backendReport.chain,
    address: backendReport.address,
    riskScore: backendReport.riskScore || backendReport.risk_score,
    riskTier,
    signals: (backendReport.signals || []).map((s: any) => ({
      title: s.title,
      severity: (s.severity || 'info').toLowerCase() as SignalSeverity,
      description: s.description,
      evidenceLinks: s.evidenceLinks || s.evidence_links || [],
    })),
    contractAnalysis: backendReport.contractAnalysis || backendReport.contract_analysis,
    liquidityAnalysis: backendReport.liquidityAnalysis || backendReport.liquidity_analysis,
    holderAnalysis: backendReport.holderAnalysis || backendReport.holder_analysis,
    updatedAt: backendReport.updatedAt || backendReport.updated_at,
    createdAt: backendReport.createdAt || backendReport.created_at,
    token: {
      chain: backendReport.chain as Chain,
      address: backendReport.address,
      name: backendReport.liquidityAnalysis?.tokenName || backendReport.liquidity_analysis?.tokenName || undefined,
      symbol: backendReport.liquidityAnalysis?.tokenSymbol || backendReport.liquidity_analysis?.tokenSymbol || undefined,
    },
    metrics: {
      liquidityUsd: backendReport.liquidityAnalysis?.liquidityUsd ?? backendReport.liquidity_analysis?.liquidityUsd ?? null,
      fdvUsd: backendReport.liquidityAnalysis?.fdvUsd ?? backendReport.liquidity_analysis?.fdvUsd ?? null,
      volume24hUsd: backendReport.liquidityAnalysis?.volume24hUsd ?? backendReport.liquidity_analysis?.volume24hUsd ?? null,
      top10HolderPct: backendReport.holderAnalysis?.top10Concentration ?? backendReport.holder_analysis?.top10Concentration ?? null,
      top1HolderPct: backendReport.holderAnalysis?.top1Concentration ?? backendReport.holder_analysis?.top1Concentration ?? null,
      verified: backendReport.contractAnalysis?.verified ?? backendReport.contract_analysis?.verified ?? false,
      isProxy: backendReport.contractAnalysis?.isProxy ?? backendReport.contract_analysis?.isProxy ?? false,
      pairUrl: backendReport.liquidityAnalysis?.pairUrl ?? backendReport.liquidity_analysis?.pairUrl ?? null,
    },
  };
  
  return report;
}
