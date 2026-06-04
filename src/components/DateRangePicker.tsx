import { format, addDays } from 'date-fns';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

export function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">期間</label>
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={startDate}
          min={today}
          max={endDate || maxDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <span className="text-gray-500 text-sm">〜</span>
        <input
          type="date"
          value={endDate}
          min={startDate || today}
          max={maxDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
