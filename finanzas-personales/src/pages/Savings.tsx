import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { formatAmount, getCurrencySymbol } from '../utils/currencies';
import { convertAmount } from '../utils/exchangeRates';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import type { Saving } from '../types';

export function Savings() {
  const { data, addSaving, updateSaving, deleteSaving } = useFinance();
  const { baseCurrency, rates, currencies } = useCurrency();
  const [modal, setModal] = useState<{ open: boolean; edit?: Saving }>({ open: false });

  const totalCurrent = data.savings.reduce((s, sa) => s + convertAmount(sa.currentAmount, sa.currency, baseCurrency, rates), 0);
  const totalTarget = data.savings.reduce((s, sa) => s + convertAmount(sa.targetAmount, sa.currency, baseCurrency, rates), 0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const targetAmount = parseFloat(form.get('targetAmount') as string);
    const currentAmount = parseFloat(form.get('currentAmount') as string);
    const currency = form.get('currency') as string;
    const notes = form.get('notes') as string;
    if (!name || !targetAmount || !currency) return;

    if (modal.edit) {
      updateSaving(modal.edit.id, { name, targetAmount, currentAmount, currency, notes });
    } else {
      addSaving({ name, targetAmount, currentAmount, currency, notes });
    }
    setModal({ open: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ahorros</h2>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} /> Nueva meta de ahorro
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total ahorrado</p>
          <p className="text-xl font-bold text-amber-600">{formatAmount(totalCurrent, baseCurrency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Meta total</p>
          <p className="text-xl font-bold text-gray-900">{formatAmount(totalTarget, baseCurrency)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.savings.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-4">No hay metas de ahorro.</p>
        ) : (
          data.savings.map(sa => {
            const pct = sa.targetAmount > 0 ? Math.min((sa.currentAmount / sa.targetAmount) * 100, 100) : 0;
            return (
              <div key={sa.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={18} className="text-amber-500" />
                    <h4 className="text-sm font-semibold text-gray-900">{sa.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{formatAmount(sa.currentAmount, sa.currency)} / {formatAmount(sa.targetAmount, sa.currency)}</span>
                    <button onClick={() => setModal({ open: true, edit: sa })} className="p-1 text-gray-400 hover:text-blue-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteSaving(sa.id)} className="p-1 text-gray-400 hover:text-rose-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-amber-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% completado{sa.notes ? ` — ${sa.notes}` : ''}</p>
              </div>
            );
          })
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar meta de ahorro' : 'Nueva meta de ahorro'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input name="name" defaultValue={modal.edit?.name ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta</label>
              <input name="targetAmount" type="number" step="0.01" min="0.01" defaultValue={modal.edit?.targetAmount ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ahorrado</label>
              <input name="currentAmount" type="number" step="0.01" min="0" defaultValue={modal.edit?.currentAmount ?? 0} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <select name="currency" defaultValue={modal.edit?.currency ?? baseCurrency} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} {getCurrencySymbol(c.code)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea name="notes" rows={2} defaultValue={modal.edit?.notes ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">
              {modal.edit ? 'Guardar cambios' : 'Agregar meta'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
