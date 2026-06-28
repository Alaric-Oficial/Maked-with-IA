import { createContext, useContext, useCallback, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type {
  Transaction, Investment, Saving, Goal, Budget,
  RecurringTransaction, FinanceData,
} from '../types';
import { generateId, nowISO, todayISO } from '../utils/formatters';

interface FinanceContextType {
  data: FinanceData;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addRecurring: (t: Omit<RecurringTransaction, 'id' | 'createdAt'>) => void;
  updateRecurring: (id: string, t: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  generateRecurringTransactions: () => void;
  addInvestment: (t: Omit<Investment, 'id' | 'createdAt'>) => void;
  updateInvestment: (id: string, t: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addSaving: (t: Omit<Saving, 'id' | 'createdAt'>) => void;
  updateSaving: (id: string, t: Partial<Saving>) => void;
  deleteSaving: (id: string) => void;
  addGoal: (t: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, t: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addBudget: (t: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (id: string, t: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  recalculateGoalProgress: (goalId: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const INITIAL: FinanceData = {
  transactions: [],
  recurringTransactions: [],
  investments: [],
  savings: [],
  goals: [],
  budgets: [],
};

function calcGoalCurrent(goal: Goal, transactions: Transaction[]): number {
  return transactions
    .filter(t => t.goalId === goal.id)
    .reduce((s, t) => (t.type === 'income' ? s + t.amount : s - t.amount), 0);
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorage<FinanceData>('finanzas_data', INITIAL);

  const addTransaction = useCallback(
    (t: Omit<Transaction, 'id' | 'createdAt'>) => {
      const tx: Transaction = { ...t, id: generateId(), createdAt: nowISO() };
      setData(prev => {
        let next = { ...prev, transactions: [tx, ...prev.transactions] };
        if (tx.goalId) {
          const goal = next.goals.find(g => g.id === tx.goalId);
          if (goal) {
            const newCurrent = calcGoalCurrent(goal, next.transactions);
            next = {
              ...next,
              goals: next.goals.map(g =>
                g.id === tx.goalId ? { ...g, currentAmount: newCurrent } : g
              ),
            };
          }
        }
        return next;
      });
    },
    [setData]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setData(prev => {
        const oldTx = prev.transactions.find(t => t.id === id);
        let goalsToRecalc = new Set<string>();
        if (oldTx?.goalId) goalsToRecalc.add(oldTx.goalId);
        if (updates.goalId && updates.goalId !== oldTx?.goalId) goalsToRecalc.add(updates.goalId);

        let next = {
          ...prev,
          transactions: prev.transactions.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        };

        for (const gid of goalsToRecalc) {
          const goal = next.goals.find(g => g.id === gid);
          if (goal) {
            const newCurrent = calcGoalCurrent(goal, next.transactions);
            next = {
              ...next,
              goals: next.goals.map(g =>
                g.id === gid ? { ...g, currentAmount: newCurrent } : g
              ),
            };
          }
        }
        return next;
      });
    },
    [setData]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setData(prev => {
        const deletedTx = prev.transactions.find(t => t.id === id);
        let next = {
          ...prev,
          transactions: prev.transactions.filter(t => t.id !== id),
        };
        if (deletedTx?.goalId) {
          const goal = next.goals.find(g => g.id === deletedTx.goalId);
          if (goal) {
            const newCurrent = calcGoalCurrent(goal, next.transactions);
            next = {
              ...next,
              goals: next.goals.map(g =>
                g.id === deletedTx.goalId ? { ...g, currentAmount: newCurrent } : g
              ),
            };
          }
        }
        return next;
      });
    },
    [setData]
  );

  const addRecurring = useCallback(
    (r: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
      const item: RecurringTransaction = { ...r, id: generateId(), createdAt: nowISO() };
      setData(prev => ({ ...prev, recurringTransactions: [item, ...prev.recurringTransactions] }));
    },
    [setData]
  );

  const updateRecurring = useCallback(
    (id: string, updates: Partial<RecurringTransaction>) => {
      setData(prev => ({
        ...prev,
        recurringTransactions: prev.recurringTransactions.map(r =>
          r.id === id ? { ...r, ...updates } : r
        ),
      }));
    },
    [setData]
  );

  const deleteRecurring = useCallback(
    (id: string) => {
      setData(prev => ({
        ...prev,
        recurringTransactions: prev.recurringTransactions.filter(r => r.id !== id),
      }));
    },
    [setData]
  );

  const generateRecurringTransactions = useCallback(() => {
    setData(prev => {
      const today = todayISO();
      let newTxns: Transaction[] = [];
      let updatedRecurring = prev.recurringTransactions.map(r => {
        if (!r.active) return r;

        let currentGen = r.lastGenerated || r.startDate;
        if (currentGen >= today) return r;
        let maxLoops = 31;
        let rCopy = { ...r };

        while (maxLoops > 0) {
          maxLoops--;
          let nextDate: Date | null = null;

          if (rCopy.frequency === 'daily') {
            const d = new Date(currentGen);
            d.setDate(d.getDate() + rCopy.interval);
            nextDate = d;
          } else if (rCopy.frequency === 'weekly') {
            const d = new Date(currentGen);
            d.setDate(d.getDate() + 7 * rCopy.interval);
            nextDate = d;
          } else if (rCopy.frequency === 'monthly') {
            const d = new Date(currentGen);
            d.setMonth(d.getMonth() + rCopy.interval);
            nextDate = d;
          } else if (rCopy.frequency === 'yearly') {
            const d = new Date(currentGen);
            d.setFullYear(d.getFullYear() + rCopy.interval);
            nextDate = d;
          }

          if (!nextDate || nextDate > new Date(today)) break;
          const dueDate = nextDate.toISOString().split('T')[0];
          if (rCopy.endDate && dueDate > rCopy.endDate) {
            rCopy.active = false;
            break;
          }

          newTxns.push({
            id: generateId(),
            type: rCopy.type,
            amount: rCopy.amount,
            currency: rCopy.currency,
            category: rCopy.category,
            description: `[Recurrente] ${rCopy.description}`,
            date: dueDate,
            goalId: rCopy.goalId,
            createdAt: nowISO(),
          });
          currentGen = dueDate;
          rCopy.lastGenerated = dueDate;
        }

        return rCopy;
      });
      let next = {
        ...prev,
        recurringTransactions: updatedRecurring,
        transactions: [...newTxns, ...prev.transactions],
      };
      for (const txn of newTxns) {
        if (txn.goalId) {
          const goal = next.goals.find(g => g.id === txn.goalId);
          if (goal) {
            const newCurrent = calcGoalCurrent(goal, next.transactions);
            next = {
              ...next,
              goals: next.goals.map(g =>
                g.id === txn.goalId ? { ...g, currentAmount: newCurrent } : g
              ),
            };
          }
        }
      }
      return next;
    });
  }, [setData]);

  const addInvestment = useCallback(
    (inv: Omit<Investment, 'id' | 'createdAt'>) => {
      const item: Investment = { ...inv, id: generateId(), createdAt: nowISO() };
      setData(prev => ({ ...prev, investments: [item, ...prev.investments] }));
    },
    [setData]
  );

  const updateInvestment = useCallback(
    (id: string, updates: Partial<Investment>) => {
      setData(prev => ({
        ...prev,
        investments: prev.investments.map(i =>
          i.id === id ? { ...i, ...updates } : i
        ),
      }));
    },
    [setData]
  );

  const deleteInvestment = useCallback(
    (id: string) => {
      setData(prev => ({
        ...prev,
        investments: prev.investments.filter(i => i.id !== id),
      }));
    },
    [setData]
  );

  const addSaving = useCallback(
    (s: Omit<Saving, 'id' | 'createdAt'>) => {
      const item: Saving = { ...s, id: generateId(), createdAt: nowISO() };
      setData(prev => ({ ...prev, savings: [item, ...prev.savings] }));
    },
    [setData]
  );

  const updateSaving = useCallback(
    (id: string, updates: Partial<Saving>) => {
      setData(prev => ({
        ...prev,
        savings: prev.savings.map(s =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }));
    },
    [setData]
  );

  const deleteSaving = useCallback(
    (id: string) => {
      setData(prev => ({
        ...prev,
        savings: prev.savings.filter(s => s.id !== id),
      }));
    },
    [setData]
  );

  const addGoal = useCallback(
    (g: Omit<Goal, 'id' | 'createdAt'>) => {
      const item: Goal = { ...g, id: generateId(), createdAt: nowISO() };
      setData(prev => ({ ...prev, goals: [item, ...prev.goals] }));
    },
    [setData]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      setData(prev => ({
        ...prev,
        goals: prev.goals.map(g =>
          g.id === id ? { ...g, ...updates } : g
        ),
      }));
    },
    [setData]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setData(prev => ({
        ...prev,
        goals: prev.goals.filter(g => g.id !== id),
      }));
    },
    [setData]
  );

  const addBudget = useCallback(
    (b: Omit<Budget, 'id' | 'createdAt'>) => {
      const item: Budget = { ...b, id: generateId(), createdAt: nowISO() };
      setData(prev => ({ ...prev, budgets: [item, ...prev.budgets] }));
    },
    [setData]
  );

  const updateBudget = useCallback(
    (id: string, updates: Partial<Budget>) => {
      setData(prev => ({
        ...prev,
        budgets: prev.budgets.map(b =>
          b.id === id ? { ...b, ...updates } : b
        ),
      }));
    },
    [setData]
  );

  const deleteBudget = useCallback(
    (id: string) => {
      setData(prev => ({
        ...prev,
        budgets: prev.budgets.filter(b => b.id !== id),
      }));
    },
    [setData]
  );

  const recalculateGoalProgress = useCallback(
    (goalId: string) => {
      setData(prev => {
        const goal = prev.goals.find(g => g.id === goalId);
        if (!goal) return prev;
        const newCurrent = calcGoalCurrent(goal, prev.transactions);
        return {
          ...prev,
          goals: prev.goals.map(g =>
            g.id === goalId ? { ...g, currentAmount: newCurrent } : g
          ),
        };
      });
    },
    [setData]
  );

  useEffect(() => {
    generateRecurringTransactions();
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        data,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        generateRecurringTransactions,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addSaving,
        updateSaving,
        deleteSaving,
        addGoal,
        updateGoal,
        deleteGoal,
        addBudget,
        updateBudget,
        deleteBudget,
        recalculateGoalProgress,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
