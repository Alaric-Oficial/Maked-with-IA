import type { CurrencyConfig } from '../types';

export const AVAILABLE_CURRENCIES: CurrencyConfig[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense' },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina' },
  { code: 'JPY', symbol: '¥', name: 'Yen japonés' },
  { code: 'ARS', symbol: '$', name: 'Peso argentino' },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano' },
  { code: 'PEN', symbol: 'S/', name: 'Sol peruano' },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño' },
  { code: 'CLP', symbol: '$', name: 'Peso chileno' },
  { code: 'COP', symbol: '$', name: 'Peso colombiano' },
];

export const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  JPY: 162.5,
  ARS: 980,
  MXN: 18.5,
  PEN: 4.05,
  BRL: 5.45,
  CLP: 990,
  COP: 4400,
};

export function getCurrencySymbol(code: string): string {
  return AVAILABLE_CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

export function formatAmount(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const decimals = ['JPY'].includes(currency) ? 0 : 2;
  return `${symbol} ${amount.toLocaleString('es', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
