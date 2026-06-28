import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { formatAmount, getCurrencySymbol } from '../utils/currencies';
import { convertAmount } from '../utils/exchangeRates';
import { formatDate, getMonthKey, currentMonthKey } from '../utils/formatters';
import { Plus, Pencil, Trash2, Target, Clock, ArrowRight } from 'lucide-react';
import type { Goal } from '../types';

export function Goals() {
  const { data, addGoal, updateGoal, deleteGoal } = useFinance();
  const { baseCurrency, rates, currencies } = useCurrency();
  const [modal, setModal] = useState<{ open: boolean; edit?: Goal }>({ open: false });

  const totalCurrent = data.goals.reduce((s, g) => s + convertAmount(g.currentAmount, g.currency, baseCurrency, rates), 0);
  const totalTarget = data.goals.reduce((s, g) => s + convertAmount(g.targetAmount, g.currency, baseCurrency, rates), 0);

  function getGoalTransactions(goalId: string) {
    return data.transactions.filter(t => t.goalId === goalId);
  }

  function estimateCompletion(goal: Goal): string | null {
    const currentMonth = currentMonthKey();
    const incomeThisMonth = data.transactions
      .filter(t => t.goalId === goal.id && t.type === 'income' && getMonthKey(t.date) === currentMonth)
      .reduce((s, t) => s + t.amount, 0);
    if (incomeThisMonth <= 0) return null;
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return null;
    const monthsNeeded = Math.ceil(remaining / incomeThisMonth);
    if (monthsNeeded > 120) return null;
    return `${monthsNeeded} mes${monthsNeeded > 1 ? 'es' : ''}`;
  }

  const getDeadlineStatus = (deadline: string) => {
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Vencido', color: 'text-rose-600 bg-rose-50' };
    if (daysLeft <= 7) return { label: `${daysLeft}d restantes`, color: 'text-amber-600 bg-amber-50' };
    if (daysLeft <= 30) return { label: `${daysLeft}d restantes`, color: 'text-blue-600 bg-blue-50' };
    return { label: `${daysLeft}d restantes`, color: 'text-gray-500 bg-gray-50' };
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const targetAmount = parseFloat(form.get('targetAmount') as string);
    const currentAmount = parseFloat(form.get('currentAmount') as string);
    const currency = form.get('currency') as string;
    const deadline = form.get('deadline') as string;
    const notes = form.get('notes') as string;
    if (!name || !targetAmount || !currency) return;

    if (modal.edit) {
      updateGoal(modal.edit.id, { name, targetAmount, currentAmount, currency, deadline, notes });
    } else {
      addGoal({ name, targetAmount, currentAmount, currency, deadline, notes });
    }
    setModal({ open: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Objetivos financieros</h2>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={18} /> Nuevo objetivo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total acumulado</p>
          <p className="text-xl font-bold text-blue-600">{formatAmount(totalCurrent, baseCurrency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Meta total</p>
          <p className="text-xl font-bold text-gray-900">{formatAmount(totalTarget, baseCurrency)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.goals.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-4">No hay objetivos registrados.</p>
        ) : (
          data.goals.map(g => {
            const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
            const deadlineInfo = g.deadline ? getDeadlineStatus(g.deadline) : null;
            const linkedTxns = getGoalTransactions(g.id);
            const estimated = estimateCompletion(g);
            return (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-900">{g.name}</h4>
                    {linkedTxns.length > 0 && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{linkedTxns.length} transacciones vinculadas</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {deadlineInfo && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 ${deadlineInfo.color}`}>
                        <Clock size={12} /> {deadlineInfo.label}
                      </span>
                    )}
                    <button onClick={() => setModal({ open: true, edit: g })} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                    <button onClick={() => deleteGoal(g.id)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{formatAmount(g.currentAmount, g.currency)}</span>
                  <span className="text-sm text-gray-400">{formatAmount(g.targetAmount, g.currency)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">
                    {pct.toFixed(1)}% completado
                    {g.deadline ? ` · Límite: ${formatDate(g.deadline)}` : ''}
                    {g.notes ? ` — ${g.notes}` : ''}
                  </p>
                  {g.currentAmount > 0 && linkedTxns.length === 0 && pct < 100 && (
                    <span className="text-xs text-amber-600">Progreso manual — vincula transacciones para auto-actualizarlo</span>
                  )}
                </div>
                {estimated && pct < 100 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5">
                    <ArrowRight size={12} />
                    Al ritmo actual de aportes, completarás este objetivo en aproximadamente {estimated}
                  </div>
                )}
                {linkedTxns.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {linkedTxns.slice(0, 3).map(t => (
                      <div key={t.id} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                        <span>{formatDate(t.date)} — {t.description || t.category}</span>
                        <span className={t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                          {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, t.currency)}
                        </span>
                      </div>
                    ))}
                    {linkedTxns.length > 3 && <p className="text-xs text-gray-400">...y {linkedTxns.length - 3} más</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar objetivo' : 'Nuevo objetivo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input name="name" defaultValue={modal.edit?.name ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta</label>
              <input name="targetAmount" type="number" step="0.01" min="0.01" defaultValue={modal.edit?.targetAmount ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ahorrado</label>
              <input name="currentAmount" type="number" step="0.01" min="0" defaultValue={modal.edit?.currentAmount ?? 0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="currency" defaultValue={modal.edit?.currency ?? baseCurrency} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code} {getCurrencySymbol(c.code)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input name="deadline" type="date" defaultValue={modal.edit?.deadline ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea name="notes" rows={2} defaultValue={modal.edit?.notes ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              {modal.edit ? 'Guardar cambios' : 'Agregar objetivo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
