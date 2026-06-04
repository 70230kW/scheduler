import { useState, useCallback } from 'react';
import { FreeSlot } from '../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export function slotKey(slot: FreeSlot) {
  return slot.start.toISOString();
}

interface CalendarGridProps {
  slots: FreeSlot[];
  nameMap: Record<string, string>;
  selfName: string;
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
}

export function CalendarGrid({
  slots,
  nameMap,
  selfName,
  selectedKeys,
  onSelectionChange,
}: CalendarGridProps) {
  const [dragging, setDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  const dates = [...new Set(slots.map((s) => format(s.start, 'yyyy-MM-dd')))].sort();

  const slotMap = new Map<string, Map<string, FreeSlot>>();
  for (const slot of slots) {
    const d = format(slot.start, 'yyyy-MM-dd');
    const t = format(slot.start, 'HH:mm');
    if (!slotMap.has(d)) slotMap.set(d, new Map());
    slotMap.get(d)!.set(t, slot);
  }

  const handleMouseDown = useCallback(
    (key: string, isSelected: boolean) => {
      const mode = isSelected ? 'deselect' : 'select';
      setDragging(true);
      setDragMode(mode);
      const next = new Set(selectedKeys);
      if (mode === 'select') next.add(key);
      else next.delete(key);
      onSelectionChange(next);
    },
    [selectedKeys, onSelectionChange]
  );

  const handleMouseEnter = useCallback(
    (key: string) => {
      if (!dragging) return;
      const next = new Set(selectedKeys);
      if (dragMode === 'select') next.add(key);
      else next.delete(key);
      onSelectionChange(next);
    },
    [dragging, dragMode, selectedKeys, onSelectionChange]
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  if (dates.length === 0) return null;

  return (
    <div
      className="overflow-x-auto select-none rounded-xl border border-gray-700 bg-gray-900"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `52px repeat(${dates.length}, minmax(120px, 1fr))`,
        }}
      >
        {/* ヘッダー行 */}
        <div className="bg-gray-800 border-b border-r border-gray-700" />
        {dates.map((date) => (
          <div
            key={date}
            className="bg-gray-800 border-b border-r border-gray-700 text-center py-2"
          >
            <p className="text-xs text-gray-400">
              {format(new Date(date + 'T00:00:00'), 'M/d', { locale: ja })}
            </p>
            <p className="text-sm font-semibold text-gray-100">
              {format(new Date(date + 'T00:00:00'), '(EEE)', { locale: ja })}
            </p>
          </div>
        ))}

        {/* 時間行 */}
        {TIME_SLOTS.map((time, timeIdx) => {
          const isHourBoundary = timeIdx % 2 === 0;
          return (
            <>
              <div
                key={`label-${time}`}
                className="bg-gray-800 border-r border-gray-700 flex items-start justify-end pr-2 pt-0.5"
                style={{
                  height: '44px',
                  borderTop: isHourBoundary ? '1px solid #374151' : '1px solid #1f2937',
                }}
              >
                {isHourBoundary && (
                  <span className="text-xs text-gray-500">{time}</span>
                )}
              </div>

              {dates.map((date) => {
                const slot = slotMap.get(date)?.get(time);
                const isFree = !!slot;
                const isSelected = isFree && selectedKeys.has(slotKey(slot!));
                const attendees = slot
                  ? [selfName, ...slot.availableUsers.map((e) => nameMap[e] ?? e)]
                  : [];

                return (
                  <div
                    key={`${date}-${time}`}
                    className={`border-r transition-colors ${
                      isFree
                        ? isSelected
                          ? 'bg-blue-600 cursor-pointer'
                          : 'bg-emerald-900 hover:bg-emerald-800 cursor-pointer'
                        : 'bg-gray-900 cursor-default'
                    }`}
                    style={{
                      height: '44px',
                      borderTop: isHourBoundary ? '1px solid #374151' : '1px solid #1f2937',
                      borderRightColor: '#374151',
                    }}
                    onMouseDown={
                      isFree ? () => handleMouseDown(slotKey(slot!), isSelected) : undefined
                    }
                    onMouseEnter={
                      isFree ? () => handleMouseEnter(slotKey(slot!)) : undefined
                    }
                  >
                    {isFree && (
                      <div className="h-full px-1.5 overflow-hidden flex flex-col justify-center">
                        {isSelected ? (
                          <p className="text-xs text-blue-100 font-medium truncate">✓ {time}</p>
                        ) : (
                          <p className="text-xs text-emerald-300 truncate leading-snug">
                            {attendees.join(' · ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-900 border border-emerald-700" />
          <span className="text-xs text-gray-500">空き（クリック・ドラッグで選択）</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-600" />
          <span className="text-xs text-gray-500">選択済み</span>
        </div>
      </div>
    </div>
  );
}
