import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { ExchangeRates } from '../types';
import { fetchExchangeRates } from '../utils/exchangeRates';
import { AVAILABLE_CURRENCIES } from '../utils/currencies';

interface CurrencyContextType {
  baseCurrency: string;
  setBaseCurrency: (c: string) => void;
  rates: Record<string, number>;
  loading: boolean;
  currencies: typeof AVAILABLE_CURRENCIES;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [baseCurrency, setBaseCurrency] = useLocalStorage('finanzas_base_currency', 'EUR');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchExchangeRates().then((data: ExchangeRates) => {
      if (mounted) {
        setRates(data.rates);
        setLoading(false);
      }
    });
    const interval = setInterval(() => {
      fetchExchangeRates().then((data: ExchangeRates) => {
        if (mounted) setRates(data.rates);
      });
    }, 60 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <CurrencyContext.Provider
      value={{ baseCurrency, setBaseCurrency, rates, loading, currencies: AVAILABLE_CURRENCIES }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
