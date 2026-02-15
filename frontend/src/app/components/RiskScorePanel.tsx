import { RiskTier, getRiskColor } from '../../lib/api';
import { RiskBadge } from './RiskBadge';
import { Progress } from './ui/progress';

interface RiskScorePanelProps {
  score: number;
  tier: RiskTier;
}

export function RiskScorePanel({ score, tier }: RiskScorePanelProps) {
  const color = getRiskColor(score);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
      <h3 className="text-sm font-medium text-[#6B7280] mb-4">Risk Score</h3>

      <div className="flex items-center justify-between mb-4">
        <div className="text-5xl font-semibold text-[#111827]">{score}</div>
        <RiskBadge tier={tier} size="md" />
      </div>

      <div className="relative h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-[#6B7280]">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}