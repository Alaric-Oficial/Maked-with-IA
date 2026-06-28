import type { ExchangeRates } from '../types';
import { FALLBACK_RATES } from './currencies';

const STORAGE_KEY = 'finanzas_exchange_rates';
const API_URL = 'https://api.exchangerate-api.com/v4/latest/EUR';

export function getStoredRates(): ExchangeRates | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const rates: ExchangeRates = JSON.parse(stored);
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - new Date(rates.updatedAt).getTime() > oneHour) {
      return null;
    }
    return rates;
  } catch {
    return null;
  }
}

export function storeRates(rates: ExchangeRates): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const stored = getStoredRates();
  if (stored) return stored;

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const rates: ExchangeRates = {
      base: 'EUR',
      rates: data.rates,
      updatedAt: new Date().toISOString(),
    };
    storeRates(rates);
    return rates;
  } catch {
    return {
      base: 'EUR',
      rates: FALLBACK_RATES,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;
  const inBase = amount / fromRate;
  return inBase * toRate;
}
