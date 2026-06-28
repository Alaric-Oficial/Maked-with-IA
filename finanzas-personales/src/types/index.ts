export type TransactionType = 'expense' | 'income';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  goalId?: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate?: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  lastGenerated?: string;
  active: boolean;
  goalId?: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  amountInvested: number;
  currentValue: number;
  currency: string;
  date: string;
  notes: string;
  history: { date: string; value: number }[];
  createdAt: string;
}

export interface Saving {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  notes: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string;
  notes: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  currency: string;
  month: string;
  createdAt: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}

export interface FinanceData {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  investments: Investment[];
  savings: Saving[];
  goals: Goal[];
  budgets: Budget[];
}

export type Page =
  | 'dashboard'
  | 'transactions'
  | 'investments'
  | 'savings'
  | 'goals'
  | 'calendar'
  | 'recurring'
  | 'budgets'
  | 'reports';
