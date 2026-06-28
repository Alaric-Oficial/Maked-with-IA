import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { getMonthKey, formatMonth, currentMonthKey, downloadCSV, addMonths } from '../utils/formatters';
import { formatAmount } from '../utils/currencies';
import { convertAmount } from '../utils/exchangeRates';
import { Download, FileText } from 'lucide-react';

export function Reports() {
  const { data } = useFinance();
  const { baseCurrency, rates } = useCurrency();
  const [from, setFrom] = useState(addMonths(currentMonthKey(), -3));
  const [to, setTo] = useState(currentMonthKey());

  const filtered = data.transactions.filter(t => {
    const mk = getMonthKey(t.date);
    return mk >= from && mk <= to;
  });

  function exportTransactions() {
    downloadCSV(
      `transacciones-${from}-${to}.csv`,
      ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Moneda', 'Objetivo'],
      filtered.map(t => [
        t.date,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.category,
        t.description,
        String(t.amount),
        t.currency,
        t.goalId ? data.goals.find(g => g.id === t.goalId)?.name ?? '' : '',
      ])
    );
  }

  function exportGoals() {
    downloadCSV(
      'objetivos.csv',
      ['Nombre', 'Meta', 'Ahorrado', 'Progreso %', 'Fecha límite', 'Notas'],
      data.goals.map(g => [
        g.name,
        String(g.targetAmount),
        String(g.currentAmount),
        g.targetAmount > 0 ? String(Math.round((g.currentAmount / g.targetAmount) * 100)) : '0',
        g.deadline,
        g.notes,
      ])
    );
  }

  function exportInvestments() {
    downloadCSV(
      'inversiones.csv',
      ['Nombre', 'Tipo', 'Invertido', 'Valor actual', 'Moneda', 'Ganancia %', 'Fecha'],
      data.investments.map(i => [
        i.name,
        i.type,
        String(i.amountInvested),
        String(i.currentValue),
        i.currency,
        i.amountInvested > 0 ? String(Math.round(((i.currentValue - i.amountInvested) / i.amountInvested) * 100)) : '0',
        i.date,
      ])
    );
  }

  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + convertAmount(t.amount, t.currency, baseCurrency, rates), 0);
  const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + convertAmount(t.amount, t.currency, baseCurrency, rates), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Reportes y exportación</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Rango de fechas</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Desde</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {getMonthOptions(from, to).map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Hasta</label>
            <select value={to} onChange={e => setTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {getMonthOptions(from, to).map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ingresos (rango)</p>
          <p className="text-xl font-bold text-emerald-600">{formatAmount(income, baseCurrency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Gastos (rango)</p>
          <p className="text-xl font-bold text-rose-600">{formatAmount(expenses, baseCurrency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Transacciones</p>
          <p className="text-xl font-bold text-gray-900">{filtered.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={exportTransactions} className="flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Download size={18} /> Exportar transacciones CSV
        </button>
        <button onClick={exportGoals} className="flex items-center justify-center gap-2 bg-emerald-600 text-white p-4 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
          <FileText size={18} /> Exportar objetivos CSV
        </button>
        <button onClick={exportInvestments} className="flex items-center justify-center gap-2 bg-violet-600 text-white p-4 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
          <FileText size={18} /> Exportar inversiones CSV
        </button>
      </div>
    </div>
  );
}

function getMonthOptions(from: string, to: string): string[] {
  const months: string[] = [];
  let current = from;
  while (current <= to) {
    months.push(current);
    current = addMonths(current, 1);
  }
  if (months.length <= 1) {
    const now = currentMonthKey();
    for (let i = -6; i <= 0; i++) {
      months.push(addMonths(now, i));
    }
  }
  return [...new Set(months)].sort();
}
