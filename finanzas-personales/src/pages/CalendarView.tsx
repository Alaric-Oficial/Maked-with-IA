import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Calendar } from '../components/Calendar';
import { MonthSelector } from '../components/MonthSelector';
import { getMonthKey, currentMonthKey } from '../utils/formatters';

export function CalendarView() {
  const { data } = useFinance();
  const [month, setMonth] = useState(currentMonthKey());

  const monthTxns = useMemo(
    () => data.transactions.filter(t => getMonthKey(t.date) === month),
    [data.transactions, month]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Calendario</h2>
        <MonthSelector month={month} onChange={setMonth} />
      </div>
      <Calendar month={month} transactions={monthTxns} />
    </div>
  );
}
