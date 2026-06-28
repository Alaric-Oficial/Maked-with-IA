import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { formatAmount } from '../utils/currencies';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatDate, todayISO } from '../utils/formatters';
import { Plus, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import type { RecurringTransaction, TransactionType, Frequency } from '../types';

function ModalRecurring({ open, onClose, edit, onSave }: {
  open: boolean;
  onClose: () => void;
  edit?: RecurringTransaction;
  onSave: (d: Omit<RecurringTransaction, 'id' | 'createdAt'>) => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const type = (f.get('type') as TransactionType) || 'expense';
    const amount = parseFloat(f.get('amount') as string);
    const category = f.get('category') as string;
    const description = f.get('description') as string;
    const frequency = (f.get('frequency') as Frequency) || 'monthly';
    const startDate = f.get('startDate') as string;
    if (!amount || !category || !startDate) return;

    onSave({
      type, amount, currency: 'EUR', category, description,
      frequency, interval: 1, dayOfMonth: undefined, dayOfWeek: undefined,
      startDate, endDate: undefined, lastGenerated: undefined,
      active: true, goalId: undefined,
    });
    onClose();
  }

  const cats = (edit?.type ?? 'expense') === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <Modal open={open} onClose={onClose} title={edit ? 'Editar recurrente' : 'Nuevo recurrente'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
            <select name="type" defaultValue={edit?.type ?? 'expense'} className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Frecuencia</label>
            <select name="frequency" defaultValue={edit?.frequency ?? 'monthly'} className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monto</label>
            <input name="amount" type="number" step="0.01" min="0.01" defaultValue={edit?.amount ?? ''} required className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
            <select name="category" defaultValue={edit?.category ?? cats[0]} className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Inicio</label>
            <input name="startDate" type="date" defaultValue={edit?.startDate ?? todayISO()} className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
          <input name="description" defaultValue={edit?.description ?? ''} placeholder="Alquiler, suscripción..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            {edit ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function Recurring() {
  const { data, addRecurring, updateRecurring, deleteRecurring, generateRecurringTransactions } = useFinance();
  const { baseCurrency } = useCurrency();
  const [modal, setModal] = useState<{ open: boolean; edit?: RecurringTransaction }>({ open: false });
  const [generating, setGenerating] = useState(false);

  function handleSave(d: Omit<RecurringTransaction, 'id' | 'createdAt'>) {
    if (modal.edit) {
      updateRecurring(modal.edit.id, d);
    } else {
      addRecurring(d);
    }
    setModal({ open: false });
  }

  function doGenerate() {
    setGenerating(true);
    setTimeout(() => { generateRecurringTransactions(); setGenerating(false); }, 200);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Recurrentes</h2>
        <div className="flex items-center gap-2">
          <button onClick={doGenerate} disabled={generating}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100">
            <RefreshCw size={16} className={generating ? 'animate-spin' : ''} /> Generar ahora
          </button>
          <button onClick={() => setModal({ open: true })} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {data.recurringTransactions.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">No hay recurrentes. Creá uno para pagos automáticos (alquiler, suscripciones...).</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.recurringTransactions.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`p-1.5 rounded-lg shrink-0 ${r.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <RefreshCw size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.description || r.category}</p>
                    <p className="text-xs text-gray-400">
                      {r.category} · cada {r.frequency === 'monthly' ? 'mes' : r.frequency === 'weekly' ? 'semana' : r.frequency === 'daily' ? 'día' : 'año'}
                      {r.lastGenerated ? ` · último: ${formatDate(r.lastGenerated)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-semibold ${r.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {r.type === 'income' ? '+' : '-'}{formatAmount(r.amount, r.currency || baseCurrency)}
                  </span>
                  <button onClick={() => setModal({ open: true, edit: r })} className="p-1 text-gray-300 hover:text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => deleteRecurring(r.id)} className="p-1 text-gray-300 hover:text-rose-600"><Trash2 size={14} /></button>
                  <button onClick={() => updateRecurring(r.id, { active: !r.active })} className={`p-1 ${r.active ? 'text-emerald-500' : 'text-gray-300'}`} title={r.active ? 'Desactivar' : 'Activar'}>
                    {r.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ModalRecurring
        open={modal.open}
        onClose={() => setModal({ open: false })}
        edit={modal.edit}
        onSave={handleSave}
      />
    </div>
  );
}
