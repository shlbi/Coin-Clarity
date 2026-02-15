// Generated types from schema.json
export type Chain = "ethereum" | "base";

export type RiskTier = "extreme" | "high" | "medium" | "low";

export type SignalSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface Signal {
  title: string;
  severity: SignalSeverity;
  description: string;
  evidenceLinks: string[];
}

export interface PrivilegeFlag {
  name: string;
  selector: string;
  riskLevel: string;
}

export interface ContractAnalysis {
  isProxy: boolean;
  verified: boolean;
  privilegeFlags: PrivilegeFlag[];
}

export interface LiquidityAnalysis {
  liquidityUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  pairUrl: string | null;
  lowLiquidity: boolean;
  suspiciousRatio: boolean;
}

export interface HolderAnalysis {
  holdersUnavailable: boolean;
  top1Concentration: number | null;
  top10Concentration: number | null;
}

export interface AnalysisReport {
  chain: Chain;
  address: string;
  riskScore: number;
  riskTier: RiskTier;
  signals: Signal[];
  contractAnalysis: ContractAnalysis;
  liquidityAnalysis: LiquidityAnalysis;
  holderAnalysis: HolderAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyzeRequest {
  chain: Chain;
  address: string;
}

export type AnalyzeResponse =
  | {
      status: "completed";
      report: AnalysisReport;
    }
  | {
      status: "processing";
      jobId: string;
    };
