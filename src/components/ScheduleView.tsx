import { useState } from 'react';
import { FreeSlot } from '../types';
import { FreeSlotCard } from './FreeSlotCard';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ScheduleViewProps {
  slots: FreeSlot[];
  nameMap: Record<string, string>;
  loading: boolean;
}

function slotKey(slot: FreeSlot) {
  return slot.start.toISOString();
}

function generateEmailBody(slots: FreeSlot[]): string {
  if (slots.length === 0) return '';
  const lines = slots.map((slot) => {
    const date = format(slot.start, 'M月d日(EEE)', { locale: ja });
    const start = format(slot.start, 'HH:mm');
    const end = format(slot.end, 'HH:mm');
    return `・${date} ${start}〜${end}`;
  });
  return `お世話になっております。

ご面談のお時間をいただきたく、下記の日程でご都合はいかがでしょうか。

${lines.join('\n')}

ご確認のほど、よろしくお願いいたします。`;
}

export function ScheduleView({ slots, nameMap, loading }: ScheduleViewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  function toggle(slot: FreeSlot) {
    const key = slotKey(slot);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setCopied(false);
  }

  async function copyEmailBody() {
    const selectedSlots = slots.filter((s) => selected.has(slotKey(s)));
    const body = generateEmailBody(selectedSlots);
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

  const grouped = slots.reduce<Record<string, FreeSlot[]>>((acc, slot) => {
    const key = format(slot.start, 'yyyy-MM-dd');
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const selectedSlots = slots.filter((s) => selected.has(slotKey(s)));
  const emailBody = generateEmailBody(selectedSlots);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{slots.length}件の空き時間が見つかりました</p>
        {selected.size > 0 && (
          <p className="text-sm text-blue-600 font-medium">{selected.size}件選択中</p>
        )}
      </div>

      {Object.entries(grouped).map(([date, daySlots]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {format(new Date(date + 'T00:00:00'), 'M月d日(EEE)', { locale: ja })}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {daySlots.map((slot) => (
              <FreeSlotCard
                key={slotKey(slot)}
                slot={slot}
                nameMap={nameMap}
                selected={selected.has(slotKey(slot))}
                onToggle={() => toggle(slot)}
              />
            ))}
          </div>
        </div>
      ))}

      {selected.size > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">メール本文</h3>
            <button
              onClick={copyEmailBody}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  コピーしました
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  コピー
                </>
              )}
            </button>
          </div>
          <textarea
            readOnly
            value={emailBody}
            rows={selectedSlots.length + 7}
            className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 resize-none focus:outline-none font-sans leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
