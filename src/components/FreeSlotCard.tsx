import { FreeSlot } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface FreeSlotCardProps {
  slot: FreeSlot;
  selfEmail: string;
}

export function FreeSlotCard({ slot, selfEmail: _selfEmail }: FreeSlotCardProps) {
  const dateLabel = format(slot.start, 'M月d日(EEE)', { locale: ja });
  const startTime = format(slot.start, 'HH:mm');
  const endTime = format(slot.end, 'HH:mm');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{dateLabel}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {startTime} – {endTime}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{slot.durationMinutes}分</p>
        </div>
        <div className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
          空き
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1.5">一緒に空いている人</p>
        <div className="flex flex-wrap gap-1.5">
          {slot.availableUsers.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              <span className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center font-medium">
                {email[0].toUpperCase()}
              </span>
              {email}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
