import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { MonthSelector } from '../components/MonthSelector';
import { formatAmount, getCurrencySymbol } from '../utils/currencies';
import { convertAmount } from '../utils/exchangeRates';
import { EXPENSE_CATEGORIES, getMonthKey, currentMonthKey, formatMonth } from '../utils/formatters';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Budget } from '../types';

export function Budgets() {
  const { data, addBudget, updateBudget, deleteBudget } = useFinance();
  const { baseCurrency, rates, currencies } = useCurrency();
  const [month, setMonth] = useState(currentMonthKey());
  const [modal, setModal] = useState<{ open: boolean; edit?: Budget }>({ open: false });

  const monthBudgets = useMemo(() => data.budgets.filter(b => b.month === month), [data.budgets, month]);

  const monthExpenses = useMemo(
    () => data.transactions.filter(t => t.type === 'expense' && getMonthKey(t.date) === month),
    [data.transactions, month]
  );

  const spentByCategory: Record<string, number> = {};
  for (const t of monthExpenses) {
    const val = convertAmount(t.amount, t.currency, baseCurrency, rates);
    spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + val;
  }

  function budgetInBase(b: Budget): number {
    return convertAmount(b.amount, b.currency, baseCurrency, rates);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const category = form.get('category') as string;
    const amount = parseFloat(form.get('amount') as string);
    const currency = form.get('currency') as string;
    if (!category || !amount || !currency) return;

    if (modal.edit) {
      updateBudget(modal.edit.id, { category, amount, currency, month });
    } else {
      addBudget({ category, amount, currency, month });
    }
    setModal({ open: false });
  }

  const usedCategories = monthBudgets.map(b => b.category);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Presupuestos</h2>
        <div className="flex items-center gap-3">
          <MonthSelector month={month} onChange={setMonth} />
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700"
          >
            <Plus size={18} /> Nuevo presupuesto
          </button>
        </div>
      </div>

      {monthBudgets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">No hay presupuestos para {formatMonth(month)}.</p>
          <p className="text-gray-400 text-xs mt-1">Crea un presupuesto para empezar a controlar tus gastos por categoría.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {monthBudgets.map(b => {
            const spent = spentByCategory[b.category] ?? 0;
            const bAmount = budgetInBase(b);
            const pct = bAmount > 0 ? Math.min((spent / bAmount) * 100, 100) : 0;
            const over = spent > bAmount;
            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{b.category}</h4>
                  <div className="flex items-center gap-2">
                    {over && <span className="flex items-center gap-1 text-xs text-rose-600 font-medium"><AlertTriangle size={14} /> Excedido</span>}
                    <button onClick={() => setModal({ open: true, edit: b })} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                    <button onClick={() => deleteBudget(b.id)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{formatAmount(spent, baseCurrency)} gastado</span>
                  <span className="text-sm text-gray-400">de {formatAmount(bAmount, baseCurrency)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% utilizado — {formatAmount(bAmount - spent, baseCurrency)} restante</p>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar presupuesto' : 'Nuevo presupuesto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select name="category" defaultValue={modal.edit?.category ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="" disabled>Seleccionar categoría</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c} disabled={!modal.edit && usedCategories.includes(c)}>{c}{usedCategories.includes(c) && !modal.edit ? ' (ya tiene presupuesto)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Límite</label>
              <input name="amount" type="number" step="0.01" min="0.01" defaultValue={modal.edit?.amount ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="currency" defaultValue={modal.edit?.currency ?? baseCurrency} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code} {getCurrencySymbol(c.code)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">
              {modal.edit ? 'Guardar cambios' : 'Agregar presupuesto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
