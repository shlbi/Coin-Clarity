import { RiskTier } from '../../lib/api';

interface RiskBadgeProps {
  tier: RiskTier;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ tier, size = 'md' }: RiskBadgeProps) {
  const colors = {
    Low: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20',
    Medium: 'bg-[#CA8A04]/10 text-[#CA8A04] border-[#CA8A04]/20',
    High: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20',
    Extreme: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded ${colors[tier]} ${sizes[size]}`}
    >
      {tier} Risk
    </span>
  );
}
