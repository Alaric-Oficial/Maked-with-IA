import { useCurrency } from '../context/CurrencyContext';
import { getCurrencySymbol } from '../utils/currencies';

export function CurrencySelector() {
  const { baseCurrency, setBaseCurrency, currencies } = useCurrency();

  return (
    <select
      value={baseCurrency}
      onChange={e => setBaseCurrency(e.target.value)}
      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {currencies.map(c => (
        <option key={c.code} value={c.code}>
          {getCurrencySymbol(c.code)} {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}
