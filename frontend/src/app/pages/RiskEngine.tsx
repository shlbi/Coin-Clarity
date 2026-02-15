import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function RiskEngine() {
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

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center">
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">
            Risk Engine
          </h1>
          <p className="text-[#6B7280]">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
