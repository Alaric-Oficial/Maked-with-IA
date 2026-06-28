import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { MonthSelector } from '../components/MonthSelector';
import { formatAmount } from '../utils/currencies';
import { convertAmount } from '../utils/exchangeRates';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatDate, getMonthKey, currentMonthKey, todayISO } from '../utils/formatters';
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { Transaction, TransactionType } from '../types';

export function Transactions() {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const { baseCurrency, rates, currencies } = useCurrency();
  const [month, setMonth] = useState(currentMonthKey());
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [modal, setModal] = useState<{ open: boolean; edit?: Transaction }>({ open: false });

  const filtered = useMemo(() => {
    let items = data.transactions.filter(t => getMonthKey(t.date) === month);
    if (typeFilter !== 'all') items = items.filter(t => t.type === typeFilter);
    return items;
  }, [data.transactions, month, typeFilter]);

  const total = filtered.reduce((s, t) => s + convertAmount(t.amount, t.currency, baseCurrency, rates), 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const type = (form.get('type') as TransactionType) || 'expense';
    const amount = parseFloat(form.get('amount') as string);
    const currency = form.get('currency') as string;
    const category = form.get('category') as string;
    const description = form.get('description') as string;
    const date = form.get('date') as string;
    const goalId = form.get('goalId') as string;
    if (!amount || !currency || !category) return;

    if (modal.edit) {
      updateTransaction(modal.edit.id, { type, amount, currency, category, description, date, goalId: goalId || undefined });
    } else {
      addTransaction({ type, amount, currency, category, description, date, goalId: goalId || undefined });
    }
    setModal({ open: false });
  }

  const categories = modal.edit
    ? (modal.edit.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)
    : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Transacciones</h2>
        <div className="flex items-center gap-2">
          <MonthSelector month={month} onChange={setMonth} />
          <button onClick={() => setModal({ open: true })} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Nueva
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${typeFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas</button>
        <button onClick={() => setTypeFilter('expense')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${typeFilter === 'expense' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}><ArrowDownCircle size={14} /> Gastos</button>
        <button onClick={() => setTypeFilter('income')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}><ArrowUpCircle size={14} /> Ingresos</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Total {typeFilter !== 'all' ? (typeFilter === 'expense' ? 'gastos' : 'ingresos') : ''}</p>
        <p className={`text-2xl font-bold ${typeFilter === 'expense' ? 'text-rose-600' : typeFilter === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
          {formatAmount(total, baseCurrency)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">No hay transacciones este mes.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`p-1.5 rounded-lg shrink-0 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.description || t.category}</p>
                    <p className="text-xs text-gray-400">{t.category} · {formatDate(t.date)}{t.goalId ? ' · 🎯' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, t.currency)}
                  </span>
                  <button onClick={() => setModal({ open: true, edit: t })} className="p-1 text-gray-300 hover:text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => deleteTransaction(t.id)} className="p-1 text-gray-300 hover:text-rose-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar transacción' : 'Nueva transacción'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <select name="type" defaultValue={modal.edit?.type ?? 'expense'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
              <select name="category" defaultValue={modal.edit?.category ?? EXPENSE_CATEGORIES[0]} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
            <input name="description" defaultValue={modal.edit?.description ?? ''} placeholder="Ej: Netflix, Supermercado..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Monto</label>
              <input name="amount" type="number" step="0.01" min="0.01" defaultValue={modal.edit?.amount ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Moneda</label>
              <select name="currency" defaultValue={modal.edit?.currency ?? baseCurrency} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
              <input name="date" type="date" defaultValue={modal.edit?.date ?? todayISO()} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vincular a objetivo (opcional)</label>
            <select name="goalId" defaultValue={modal.edit?.goalId ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sin objetivo</option>
              {data.goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              {modal.edit ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
