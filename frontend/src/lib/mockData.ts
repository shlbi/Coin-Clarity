// Mock data for development and demo purposes
import { AnalysisReport, Chain } from './api';

export const mockRecentTokens: Array<{
  token: {
    name: string;
    symbol: string;
    chain: Chain;
    address: string;
  };
  price: number;
  change24h: number;
  riskScore: number;
}> = [
  {
    token: {
      name: 'Uniswap',
      symbol: 'UNI',
      chain: 'ethereum',
      address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    },
    price: 8.42,
    change24h: 2.34,
    riskScore: 18,
  },
  {
    token: {
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      chain: 'ethereum',
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    },
    price: 64250.0,
    change24h: -1.23,
    riskScore: 12,
  },
  {
    token: {
      name: 'Chainlink',
      symbol: 'LINK',
      chain: 'ethereum',
      address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    },
    price: 15.67,
    change24h: 5.12,
    riskScore: 22,
  },
  {
    token: {
      name: 'Aave',
      symbol: 'AAVE',
      chain: 'ethereum',
      address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    },
    price: 287.45,
    change24h: -0.87,
    riskScore: 25,
  },
  {
    token: {
      name: 'Pepe',
      symbol: 'PEPE',
      chain: 'ethereum',
      address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    },
    price: 0.00000842,
    change24h: 12.45,
    riskScore: 68,
  },
];

export const mockDashboardStats = {
  tokensScanned24h: 3247,
  highRiskTokens24h: 892,
  marketSentiment: 'Neutral',
  activeAlerts: 12,
};

export const mockAnalysisReport: AnalysisReport = {
  token: {
    chain: 'ethereum',
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    name: 'Uniswap',
    symbol: 'UNI',
  },
  riskScore: 18,
  riskTier: 'Low',
  signals: [
    {
      id: '1',
      severity: 'low',
      title: 'Verified Source Code',
      description: 'Contract source code is verified on Etherscan with clear implementation.',
      evidenceLinks: ['https://etherscan.io/address/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984#code'],
    },
    {
      id: '2',
      severity: 'low',
      title: 'Strong Liquidity',
      description: 'Token has over $500M in liquidity across major DEXs, indicating low manipulation risk.',
    },
    {
      id: '3',
      severity: 'med',
      title: 'Moderate Holder Concentration',
      description: 'Top 10 holders control 45% of supply. While elevated, this is typical for governance tokens.',
    },
  ],
  metrics: {
    liquidityUsd: 523_450_000,
    fdvUsd: 8_420_000_000,
    top10HolderPct: 45.2,
    top1HolderPct: 12.8,
    verified: true,
    isProxy: false,
  },
  updatedAt: new Date().toISOString(),
};

export const mockSearchResults = [
  {
    name: 'Uniswap',
    symbol: 'UNI',
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    chain: 'ethereum' as Chain,
  },
  {
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    chain: 'ethereum' as Chain,
  },
  {
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    chain: 'ethereum' as Chain,
  },
];
