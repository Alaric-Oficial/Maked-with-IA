import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonth, addMonths } from '../utils/formatters';

interface Props {
  month: string;
  onChange: (m: string) => void;
}

export function MonthSelector({ month, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(addMonths(month, -1))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
        {formatMonth(month)}
      </span>
      <button
        onClick={() => onChange(addMonths(month, 1))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
