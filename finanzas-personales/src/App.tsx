import { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Investments } from './pages/Investments';
import { Savings } from './pages/Savings';
import { Goals } from './pages/Goals';
import { CalendarView } from './pages/CalendarView';
import { Recurring } from './pages/Recurring';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import type { Page } from './types';

function AppContent() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <Layout page={page} onPageChange={setPage}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'transactions' && <Transactions />}
      {page === 'investments' && <Investments />}
      {page === 'savings' && <Savings />}
      {page === 'goals' && <Goals />}
      {page === 'calendar' && <CalendarView />}
      {page === 'recurring' && <Recurring />}
      {page === 'budgets' && <Budgets />}
      {page === 'reports' && <Reports />}
    </Layout>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </CurrencyProvider>
  );
}
