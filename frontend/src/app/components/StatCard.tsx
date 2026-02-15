interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#6B7280]">{label}</p>
        {icon && <div className="text-[#6B7280]">{icon}</div>}
      </div>
      <p className="text-2xl font-semibold text-[#111827]">{value}</p>
    </div>
  );
}
