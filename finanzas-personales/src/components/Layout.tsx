import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { CurrencySelector } from './CurrencySelector';
import type { Page } from '../types';

interface Props {
  page: Page;
  onPageChange: (p: Page) => void;
  children: ReactNode;
}

export function Layout({ page, onPageChange, children }: Props) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar current={page} onChange={onPageChange} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 shrink-0">
          <CurrencySelector />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
