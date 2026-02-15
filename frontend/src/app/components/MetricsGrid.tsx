import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { TokenMetrics, formatLargeNumber } from '../../lib/api';

interface MetricsGridProps {
  metrics: TokenMetrics;
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#6B7280]">{label}</p>
        {icon}
      </div>
      <p className="text-lg font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const liquidityFdvRatio =
    metrics.liquidityUsd != null && metrics.fdvUsd != null
      ? (metrics.liquidityUsd / metrics.fdvUsd) * 100
      : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        label="Verified Source"
        value={metrics.verified != null ? (metrics.verified ? 'Yes' : 'No') : '—'}
        icon={
          metrics.verified != null ? (
            metrics.verified ? (
              <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
            ) : (
              <XCircle className="h-4 w-4 text-[#DC2626]" />
            )
          ) : undefined
        }
      />

      <MetricCard
        label="Proxy Contract"
        value={metrics.isProxy != null ? (metrics.isProxy ? 'Yes' : 'No') : '—'}
        icon={
          metrics.isProxy != null ? (
            metrics.isProxy ? (
              <AlertCircle className="h-4 w-4 text-[#CA8A04]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
            )
          ) : undefined
        }
      />

      <MetricCard
        label="Top 10 Holders"
        value={
          metrics.top10HolderPct != null
            ? `${metrics.top10HolderPct.toFixed(1)}%`
            : '—'
        }
      />

      <MetricCard
        label="Top 1 Holder"
        value={
          metrics.top1HolderPct != null
            ? `${metrics.top1HolderPct.toFixed(1)}%`
            : '—'
        }
      />

      <MetricCard
        label="Liquidity"
        value={
          metrics.liquidityUsd != null
            ? formatLargeNumber(metrics.liquidityUsd)
            : '—'
        }
      />

      <MetricCard
        label="FDV"
        value={metrics.fdvUsd != null ? formatLargeNumber(metrics.fdvUsd) : '—'}
      />

      {liquidityFdvRatio != null && (
        <MetricCard
          label="Liquidity/FDV Ratio"
          value={`${liquidityFdvRatio.toFixed(2)}%`}
        />
      )}
    </div>
  );
}
