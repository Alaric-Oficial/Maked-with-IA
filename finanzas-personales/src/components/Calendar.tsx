import { daysInMonth, firstDayOfMonth, dayDate } from '../utils/formatters';
import { formatAmount } from '../utils/currencies';
import type { Transaction } from '../types';

interface Props {
  month: string;
  transactions: Transaction[];
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function Calendar({ month, transactions }: Props) {
  const totalDays = daysInMonth(month);
  const startDay = firstDayOfMonth(month);
  const days: (number | null)[] = Array(startDay).fill(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);
  const remainder = days.length % 7;
  if (remainder > 0) for (let i = 0; i < 7 - remainder; i++) days.push(null);

  const byDay: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    const d = t.date;
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(t);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAY_NAMES.map(n => (
          <div key={n} className="p-2 text-center text-xs font-semibold text-gray-500 bg-gray-50">
            {n}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="min-h-[90px] bg-gray-50/50" />;
          const dateKey = dayDate(month, day);
          const dayTxns = byDay[dateKey] || [];
          return (
            <div
              key={dateKey}
              className="min-h-[90px] border-b border-r border-gray-100 p-1 text-xs hover:bg-blue-50/30 transition-colors"
            >
              <span className={`inline-block w-5 h-5 text-center leading-5 rounded-full text-xs font-medium ${dateKey === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {day}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayTxns.slice(0, 3).map(t => (
                  <div
                    key={t.id}
                    className={`px-1 py-0.5 rounded text-[10px] truncate font-medium ${
                      t.type === 'income'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {t.description || t.category}: {formatAmount(t.amount, t.currency)}
                  </div>
                ))}
                {dayTxns.length > 3 && (
                  <span className="text-[10px] text-gray-400">+{dayTxns.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
