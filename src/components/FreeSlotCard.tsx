import { FreeSlot } from '../types';
import { format } from 'date-fns';

interface FreeSlotCardProps {
  slot: FreeSlot;
  nameMap: Record<string, string>;
  selected: boolean;
  onToggle: () => void;
}

export function FreeSlotCard({ slot, nameMap, selected, onToggle }: FreeSlotCardProps) {
  const startTime = format(slot.start, 'HH:mm');
  const endTime = format(slot.end, 'HH:mm');

  return (
    <label
      className={`flex items-start gap-3 bg-white border rounded-xl p-4 cursor-pointer transition-all ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-sm'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-gray-900">
          {startTime} – {endTime}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {slot.availableUsers.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {nameMap[email] ?? email}
            </span>
          ))}
        </div>
      </div>
      {selected && (
        <div className="shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </label>
  );
}
