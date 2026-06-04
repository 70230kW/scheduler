import { useState } from 'react';
import { FreeSlot } from '../types';
import { FreeSlotCard } from './FreeSlotCard';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { generateHtmlEmail, createGmailDraft } from '../utils/emailDraft';

interface ScheduleViewProps {
  slots: FreeSlot[];
  nameMap: Record<string, string>;
  selfEmail: string;
  accessToken: string;
  loading: boolean;
}

function slotKey(slot: FreeSlot) {
  return slot.start.toISOString();
}

export function ScheduleView({ slots, nameMap, selfEmail, accessToken, loading }: ScheduleViewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('【日程調整】ご面談のお願い');
  const [creating, setCreating] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftError, setDraftError] = useState('');

  function toggle(slot: FreeSlot) {
    const key = slotKey(slot);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDraftUrl('');
  }

  async function handleCreateDraft() {
    if (!toEmail || selected.size === 0) return;
    setCreating(true);
    setDraftError('');
    setDraftUrl('');
    try {
      const selectedSlots = slots.filter((s) => selected.has(slotKey(s)));
      const html = generateHtmlEmail(selfEmail, selectedSlots, nameMap);
      const url = await createGmailDraft(accessToken, toEmail, subject, html);
      setDraftUrl(url);
    } catch (e: unknown) {
      setDraftError(e instanceof Error ? e.message : '下書き作成に失敗しました');
    } finally {
      setCreating(false);
    }
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
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Gmailで下書きを作成
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">宛先</label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="送り先のメールアドレスを入力"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">件名</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">メール内容のプレビュー</p>
            <p>選択した{selected.size}件の候補日程がボタン形式で表示されます。</p>
            <p>受取人がボタンをクリックすると、承認返信メールの作成画面が開きます。</p>
          </div>

          {draftError && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{draftError}</p>
          )}

          {draftUrl ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">下書きを作成しました</p>
              </div>
              <a
                href={draftUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                Gmailで開く
              </a>
            </div>
          ) : (
            <button
              onClick={handleCreateDraft}
              disabled={creating || !toEmail}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  Gmailで下書きを作成
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
