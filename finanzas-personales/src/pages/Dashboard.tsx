import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useCurrency } from '../context/CurrencyContext';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import { formatAmount, getCurrencySymbol } from '../utils/currencies';
import { convertAmount } from '../utils/exchangeRates';
import { formatDate, getMonthKey, formatMonth, currentMonthKey, todayISO, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/formatters';
import {
  ArrowDownCircle, ArrowUpCircle, TrendingUp, PiggyBank, Target, CircleDollarSign,
  Plus, AlertTriangle, Trash2, AlertOctagon, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';


const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export function Dashboard() {
  const { data, addTransaction, deleteTransaction } = useFinance();
  const { baseCurrency, rates, currencies } = useCurrency();

  const [txModal, setTxModal] = useState<{ open: boolean; type: 'expense' | 'income' }>({ open: false, type: 'expense' });

  const currentMonth = currentMonthKey();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // --- Totals ---
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + convertAmount(t.amount, t.currency, baseCurrency, rates), 0);
  const totalExpenses = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + convertAmount(t.amount, t.currency, baseCurrency, rates), 0);
  const totalInvestments = data.investments
    .reduce((s, i) => s + convertAmount(i.currentValue, i.currency, baseCurrency, rates), 0);
  const totalSavings = data.savings
    .reduce((s, sa) => s + convertAmount(sa.currentAmount, sa.currency, baseCurrency, rates), 0);
  const totalGoals = data.goals
    .reduce((s, g) => s + convertAmount(g.currentAmount, g.currency, baseCurrency, rates), 0);
  const balance = totalIncome - totalExpenses;

  // --- Monthly totals for warnings ---
  const monthIncome = data.transactions
    .filter(t => t.type === 'income' && getMonthKey(t.date) === currentMonth)
    .reduce((s, t) => s + convertAmount(t.amount, t.currency, baseCurrency, rates), 0);
  const monthExpenses = data.transactions
    .filter(t => t.type === 'expense' && getMonthKey(t.date) === currentMonth)
    .reduce((s, t) => s + convertAmount(t.amount, t.currency, baseCurrency, rates), 0);

  // --- Monthly map for charts ---
  const monthlyMap = useMemo(() => {
    const map: Record<string, { income: number; expense: number; balance: number }> = {};
    for (const t of data.transactions) {
      const key = getMonthKey(t.date);
      if (!map[key]) map[key] = { income: 0, expense: 0, balance: 0 };
      const val = convertAmount(t.amount, t.currency, baseCurrency, rates);
      if (t.type === 'income') map[key].income += val;
      else map[key].expense += val;
    }
    for (const key of Object.keys(map)) map[key].balance = map[key].income - map[key].expense;
    return map;
  }, [data.transactions, baseCurrency, rates]);

  const barChartData = useMemo(() =>
    Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([key, v]) => ({
      name: months[parseInt(key.split('-')[1]) - 1],
      income: Math.round(v.income * 100) / 100,
      expense: Math.round(v.expense * 100) / 100,
    })),
    [monthlyMap]);

  const balanceChartData = useMemo(() => {
    let running = 0;
    return Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => {
      running += v.balance;
      return { name: formatMonth(key), balance: Math.round(running * 100) / 100 };
    });
  }, [monthlyMap]);

  // --- Net worth pie ---
  const netWorthData = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    if (balance > 0) data.push({ name: 'Efectivo', value: Math.round(balance * 100) / 100 });
    if (balance < 0) data.push({ name: 'Deuda', value: Math.round(Math.abs(balance) * 100) / 100 });
    if (totalInvestments > 0) data.push({ name: 'Inversiones', value: Math.round(totalInvestments * 100) / 100 });
    if (totalSavings > 0) data.push({ name: 'Ahorros', value: Math.round(totalSavings * 100) / 100 });
    return data;
  }, [balance, totalInvestments, totalSavings]);

  // --- Month expense breakdown pie ---
  const monthExpensesByCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of data.transactions) {
      if (t.type === 'expense' && getMonthKey(t.date) === currentMonth) {
        const val = convertAmount(t.amount, t.currency, baseCurrency, rates);
        map[t.category] = (map[t.category] ?? 0) + val;
      }
    }
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [data.transactions, currentMonth, baseCurrency, rates]);

  // --- Warnings ---
  const warnings = useMemo(() => {
    const w: { type: 'danger' | 'warning' | 'info'; message: string }[] = [];

    // 1. Monthly income vs expense
    if (monthExpenses > monthIncome && monthIncome > 0) {
      w.push({
        type: 'danger',
        message: `Este mes gastaste ${formatAmount(monthExpenses - monthIncome, baseCurrency)} más de lo que ingresaste`,
      });
    } else if (monthIncome > 0 && monthExpenses / monthIncome > 0.9) {
      w.push({
        type: 'warning',
        message: `Ya gastaste el ${((monthExpenses / monthIncome) * 100).toFixed(0)}% de tus ingresos de este mes`,
      });
    }

    // 2. Budgets exceeded
    for (const b of data.budgets.filter(b => b.month === currentMonth)) {
      const spent = data.transactions
        .filter(t => t.type === 'expense' && getMonthKey(t.date) === b.month && t.category === b.category)
        .reduce((s, t) => s + convertAmount(t.amount, t.currency, baseCurrency, rates), 0);
      const budgetVal = convertAmount(b.amount, b.currency, baseCurrency, rates);
      if (spent > budgetVal) {
        w.push({ type: 'danger', message: `Presupuesto excedido: ${b.category} (${formatAmount(spent - budgetVal, baseCurrency)} sobre el límite)` });
      } else if (budgetVal > 0 && spent / budgetVal > 0.85) {
        w.push({ type: 'warning', message: `Presupuesto casi agotado: ${b.category} (${((spent / budgetVal) * 100).toFixed(0)}% usado)` });
      }
    }

    // 3. Goals approaching deadline
    for (const g of data.goals) {
      if (!g.deadline) continue;
      const daysLeft = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0 && g.currentAmount < g.targetAmount) {
        w.push({ type: 'danger', message: `Objetivo "${g.name}" vencido y no alcanzado (${formatAmount(g.targetAmount - g.currentAmount, g.currency)} restante)` });
      } else if (daysLeft <= 14 && daysLeft >= 0 && g.currentAmount < g.targetAmount) {
        w.push({ type: 'warning', message: `Objetivo "${g.name}" vence en ${daysLeft}d — falta ${formatAmount(g.targetAmount - g.currentAmount, g.currency)}` });
      }
    }

    // 4. No transactions this month
    if (data.transactions.length > 0 && monthIncome === 0 && monthExpenses === 0) {
      w.push({ type: 'info', message: 'No registraste transacciones este mes' });
    }

    return w;
  }, [data, monthExpenses, monthIncome, currentMonth, baseCurrency, rates]);

  // --- Recent ---
  const recent = data.transactions.slice(0, 8);

  function handleTxSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = parseFloat(form.get('amount') as string);
    const currency = form.get('currency') as string;
    const category = form.get('category') as string;
    const description = form.get('description') as string;
    const date = form.get('date') as string;
    const goalId = form.get('goalId') as string;
    if (!amount || !currency || !category) return;
    addTransaction({ type: txModal.type, amount, currency, category, description, date, goalId: goalId || undefined });
    setTxModal({ open: false, type: txModal.type });
  }

  return (
    <div className="space-y-6">
      {/* Header + quick actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setTxModal({ open: true, type: 'expense' })} className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-rose-700">
            <Plus size={16} /> Gasto
          </button>
          <button onClick={() => setTxModal({ open: true, type: 'income' })} className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
            <Plus size={16} /> Ingreso
          </button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-amber-500" /> Alertas
          </h3>
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 p-3 rounded-lg text-sm ${
                w.type === 'danger' ? 'bg-rose-50 border border-rose-200 text-rose-800' :
                w.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {w.type === 'danger' ? <AlertOctagon size={16} /> : w.type === 'warning' ? <AlertTriangle size={16} /> : <Clock size={16} />}
              </span>
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Balance" value={formatAmount(balance, baseCurrency)} icon={<CircleDollarSign size={22} />} color={balance >= 0 ? 'emerald' : 'rose'} />
        <StatCard title="Ingresos" value={formatAmount(totalIncome, baseCurrency)} icon={<ArrowUpCircle size={22} />} color="emerald" />
        <StatCard title="Gastos" value={formatAmount(totalExpenses, baseCurrency)} icon={<ArrowDownCircle size={22} />} color="rose" />
        <StatCard title="Inversiones" value={formatAmount(totalInvestments, baseCurrency)} icon={<TrendingUp size={22} />} color="violet" />
        <StatCard title="Ahorros" value={formatAmount(totalSavings, baseCurrency)} icon={<PiggyBank size={22} />} color="amber" />
        <StatCard title="Objetivos" value={formatAmount(totalGoals, baseCurrency)} icon={<Target size={22} />} color="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar: Income vs Expense */}
        {barChartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ingresos vs Gastos mensual</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Line: Balance evolution */}
        {balanceChartData.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Evolución del balance</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={balanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="balance" name="Balance acumulado" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie: Net worth breakdown */}
        {netWorthData.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribución del patrimonio</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={netWorthData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {netWorthData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie: Month expenses by category */}
        {monthExpensesByCat.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Gastos del mes por categoría</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={monthExpensesByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {monthExpensesByCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent transactions + inline delete */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Últimas transacciones</h3>
          <div className="flex gap-2">
            <button onClick={() => setTxModal({ open: true, type: 'expense' })} className="text-xs text-rose-600 hover:text-rose-700 font-medium">+ Gasto</button>
            <button onClick={() => setTxModal({ open: true, type: 'income' })} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Ingreso</button>
          </div>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">No hay transacciones aún.</p>
        ) : (
          <div className="space-y-1">
            {recent.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`p-1.5 rounded-lg shrink-0 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.description || t.category}</p>
                    <p className="text-xs text-gray-400">{t.category} &middot; {formatDate(t.date)}{t.goalId ? ' · 🎯' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, t.currency)}
                  </span>
                  <button onClick={() => deleteTransaction(t.id)} className="p-1 text-gray-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick add modal */}
      <Modal open={txModal.open} onClose={() => setTxModal({ open: false, type: txModal.type })} title={txModal.type === 'expense' ? 'Nuevo gasto rápido' : 'Nuevo ingreso rápido'}>
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select name="category" defaultValue={EXPENSE_CATEGORIES[0]} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(txModal.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="currency" defaultValue={baseCurrency} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code} {getCurrencySymbol(c.code)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input name="description" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
              <input name="amount" type="number" step="0.01" min="0.01" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input name="date" type="date" defaultValue={todayISO()} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a objetivo (opcional)</label>
            <select name="goalId" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sin objetivo</option>
              {data.goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setTxModal({ open: false, type: txModal.type })} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" className={`px-4 py-2 text-sm text-white rounded-lg font-medium ${txModal.type === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              Agregar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
