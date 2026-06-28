import { LayoutDashboard, Receipt, TrendingUp, PiggyBank, Target, CalendarDays, RefreshCw, CircleDollarSign, FileText } from 'lucide-react';
import type { Page } from '../types';

interface Props {
  current: Page;
  onChange: (p: Page) => void;
}

const links: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'transactions', label: 'Transacciones', icon: Receipt },
  { page: 'calendar', label: 'Calendario', icon: CalendarDays },
  { page: 'investments', label: 'Inversiones', icon: TrendingUp },
  { page: 'savings', label: 'Ahorros', icon: PiggyBank },
  { page: 'goals', label: 'Objetivos', icon: Target },
  { page: 'budgets', label: 'Presupuestos', icon: CircleDollarSign },
  { page: 'recurring', label: 'Recurrentes', icon: RefreshCw },
  { page: 'reports', label: 'Reportes', icon: FileText },
];

export function Sidebar({ current, onChange }: Props) {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          💰 Finanzas
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Control personal</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onChange(page)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              current === page
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">v2.0 — Todo en uno</p>
      </div>
    </aside>
  );
}
