import { FreeSlot } from '../types';
import { FreeSlotCard } from './FreeSlotCard';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ScheduleViewProps {
  slots: FreeSlot[];
  selfEmail: string;
  loading: boolean;
}

export function ScheduleView({ slots, selfEmail, loading }: ScheduleViewProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">カレンダーを取得中...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium">空き時間が見つかりませんでした</p>
        <p className="text-xs mt-1">期間や対象者を変えてお試しください</p>
      </div>
    );
  }

  // Group by date
  const grouped = slots.reduce<Record<string, FreeSlot[]>>((acc, slot) => {
    const key = format(slot.start, 'yyyy-MM-dd');
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">{slots.length}件の空き時間が見つかりました</p>
      {Object.entries(grouped).map(([date, daySlots]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {format(new Date(date + 'T00:00:00'), 'M月d日(EEE)', { locale: ja })}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daySlots.map((slot, i) => (
              <FreeSlotCard key={i} slot={slot} selfEmail={selfEmail} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
