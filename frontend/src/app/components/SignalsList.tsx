import { ExternalLink } from 'lucide-react';
import { Signal, SignalSeverity } from '../../lib/api';

interface SignalsListProps {
  signals: Signal[];
}

function getSeverityColor(severity: SignalSeverity): string {
  switch (severity) {
    case 'low':
      return '#16A34A';
    case 'medium':
    case 'med':
      return '#CA8A04';
    case 'high':
      return '#DC2626';
    case 'critical':
      return '#991B1B';
    default:
      return '#6B7280';
  }
}

function getSeverityLabel(severity: SignalSeverity): string {
  switch (severity) {
    case 'low':
      return 'Low';
    case 'medium':
    case 'med':
      return 'Medium';
    case 'high':
      return 'High';
    case 'critical':
      return 'Critical';
    default:
      return 'Info';
  }
}

export function SignalsList({ signals }: SignalsListProps) {
  if (signals.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center">
        <p className="text-[#6B7280]">No signals detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {signals.map((signal, index) => (
        <div
          key={`${signal.title}-${index}`}
          className="bg-white border border-[#E5E7EB] rounded-lg p-6"
        >
          <div className="flex items-start gap-3">
            <div
              className="h-2 w-2 rounded-full mt-2 flex-shrink-0"
              style={{ backgroundColor: getSeverityColor(signal.severity) }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-[#111827]">{signal.title}</h4>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${getSeverityColor(signal.severity)}20`,
                    color: getSeverityColor(signal.severity),
                  }}
                >
                  {getSeverityLabel(signal.severity)}
                </span>
              </div>
              <p className="text-sm text-[#6B7280]">{signal.description}</p>
              {signal.evidenceLinks && signal.evidenceLinks.length > 0 && (
                <div className="mt-3 space-y-1">
                  {signal.evidenceLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Evidence
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
