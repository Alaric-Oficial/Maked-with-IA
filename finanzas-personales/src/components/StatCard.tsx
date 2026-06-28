import { type ReactNode } from 'react';

interface Props {
  title: string;
  value: string;
  icon: ReactNode;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
}

const colors = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
};

export function StatCard({ title, value, icon, color = 'blue' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg shrink-0 ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}
