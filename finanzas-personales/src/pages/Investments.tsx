import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { formatAmount, getCurrencySymbol } from '../utils/currencies';
import { convertAmount } from '../utils/exchangeRates';
import { INVESTMENT_TYPES, formatDate, todayISO } from '../utils/formatters';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import type { Investment } from '../types';

export function Investments() {
  const { data, addInvestment, updateInvestment, deleteInvestment } = useFinance();
  const { baseCurrency, rates, currencies } = useCurrency();
  const [modal, setModal] = useState<{ open: boolean; edit?: Investment }>({ open: false });

  const totalInvested = data.investments.reduce((s, i) => s + convertAmount(i.amountInvested, i.currency, baseCurrency, rates), 0);
  const totalCurrent = data.investments.reduce((s, i) => s + convertAmount(i.currentValue, i.currency, baseCurrency, rates), 0);
  const profit = totalCurrent - totalInvested;
  const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const type = form.get('type') as string;
    const amountInvested = parseFloat(form.get('amountInvested') as string);
    const currentValue = parseFloat(form.get('currentValue') as string);
    const currency = form.get('currency') as string;
    const date = form.get('date') as string;
    const notes = form.get('notes') as string;
    if (!name || !amountInvested || !currentValue || !currency) return;

    if (modal.edit) {
      updateInvestment(modal.edit.id, { name, type, amountInvested, currentValue, currency, date, notes, history: modal.edit.history });
    } else {
      addInvestment({ name, type, amountInvested, currentValue, currency, date, notes, history: [] });
    }
    setModal({ open: false });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Inversiones</h2>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={18} /> Nueva inversión
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Invertido</p>
          <p className="text-xl font-bold text-gray-900">{formatAmount(totalInvested, baseCurrency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Valor actual</p>
          <p className="text-xl font-bold text-gray-900">{formatAmount(totalCurrent, baseCurrency)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ganancia/Pérdida</p>
          <p className={`text-xl font-bold flex items-center gap-1 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {profit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            {formatAmount(Math.abs(profit), baseCurrency)} ({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {data.investments.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">No hay inversiones registradas.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.investments.map(inv => {
              const invPct = inv.amountInvested > 0 ? ((inv.currentValue - inv.amountInvested) / inv.amountInvested) * 100 : 0;
              return (
                <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">{inv.name}</p>
                    <p className="text-xs text-gray-400">{inv.type} &middot; {formatDate(inv.date)}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatAmount(inv.amountInvested, inv.currency)}</p>
                      <p className="text-sm font-semibold text-gray-900">{formatAmount(inv.currentValue, inv.currency)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${invPct >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {invPct >= 0 ? '+' : ''}{invPct.toFixed(1)}%
                    </span>
                    <button onClick={() => setModal({ open: true, edit: inv })} className="p-1 text-gray-400 hover:text-blue-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteInvestment(inv.id)} className="p-1 text-gray-400 hover:text-rose-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar inversión' : 'Nueva inversión'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input name="name" defaultValue={modal.edit?.name ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select name="type" defaultValue={modal.edit?.type ?? INVESTMENT_TYPES[0]} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto invertido</label>
              <input name="amountInvested" type="number" step="0.01" min="0" defaultValue={modal.edit?.amountInvested ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor actual</label>
              <input name="currentValue" type="number" step="0.01" min="0" defaultValue={modal.edit?.currentValue ?? ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="currency" defaultValue={modal.edit?.currency ?? baseCurrency} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code} {getCurrencySymbol(c.code)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input name="date" type="date" defaultValue={modal.edit?.date ?? todayISO()} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea name="notes" rows={2} defaultValue={modal.edit?.notes ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false })} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium">
              {modal.edit ? 'Guardar cambios' : 'Agregar inversión'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
