from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class PrivilegeFlag(SQLModel):
    name: str
    selector: str
    riskLevel: str

class ContractAnalysis(SQLModel):
    isProxy: bool
    verified: bool
    privilegeFlags: List[PrivilegeFlag]

class LiquidityAnalysis(SQLModel):
    liquidityUsd: Optional[float] = None
    fdvUsd: Optional[float] = None
    volume24hUsd: Optional[float] = None
    pairUrl: Optional[str] = None
    lowLiquidity: bool
    suspiciousRatio: bool

class HolderAnalysis(SQLModel):
    holdersUnavailable: bool
    top1Concentration: Optional[float] = None
    top10Concentration: Optional[float] = None

class Signal(SQLModel):
    title: str
    severity: str  # "critical" | "high" | "medium" | "low" | "info"
    description: str
    evidenceLinks: List[str]

class AnalysisReportDB(SQLModel, table=True):
    __tablename__ = "analysis_reports"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    chain: str = Field(index=True)
    address: str = Field(index=True)
    risk_score: int
    risk_tier: str
    mrr: Optional[int] = None  # Malicious Rug Risk (0-100)
    scr: Optional[int] = None  # Structural Centralization Risk (0-100)
    mfr: Optional[int] = None  # Market Fragility Risk (0-100)
    uf: Optional[float] = None  # Uncertainty Factor (0-1)
    confidence: Optional[float] = None  # Confidence Score (0-1)
    signals: str  # JSON string
    contract_analysis: str  # JSON string
    liquidity_analysis: str  # JSON string
    holder_analysis: str  # JSON string
    token_name: Optional[str] = None
    token_symbol: Optional[str] = None
    price_usd: Optional[float] = None
    price_change_24h: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AnalysisReport(BaseModel):
    chain: str
    address: str
    riskScore: int
    riskTier: str
    signals: List[Signal]
    contractAnalysis: ContractAnalysis
    liquidityAnalysis: LiquidityAnalysis
    holderAnalysis: HolderAnalysis
    createdAt: str
    updatedAt: str
