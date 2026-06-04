import { useState } from 'react';
import { FreeSlot } from '../types';
import { CalendarGrid, slotKey } from './CalendarGrid';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { generateHtmlEmail, createGmailDraft } from '../utils/emailDraft';

interface ScheduleViewProps {
  slots: FreeSlot[];
  nameMap: Record<string, string>;
  selfEmail: string;
  selfName: string;
  accessToken: string;
  loading: boolean;
}

export function ScheduleView({
  slots,
  nameMap,
  selfEmail,
  selfName,
  accessToken,
  loading,
}: ScheduleViewProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('【日程調整】ご面談のお願い');
  const [creating, setCreating] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftError, setDraftError] = useState('');

  async function handleCreateDraft() {
    if (!toEmail || selectedKeys.size === 0) return;
    setCreating(true);
    setDraftError('');
    setDraftUrl('');
    try {
      const selectedSlots = slots.filter((s) => selectedKeys.has(slotKey(s)));
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
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">カレンダーを取得中...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <svg className="w-12 h-12 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium text-gray-300">空き時間が見つかりませんでした</p>
        <p className="text-xs mt-1 text-gray-500">期間や対象者を変えてお試しください</p>
      </div>
    );
  }

  // Group selected slots by date for summary
  const selectedSlots = slots.filter((s) => selectedKeys.has(slotKey(s)));
  const groupedSelected = selectedSlots.reduce<Record<string, FreeSlot[]>>((acc, slot) => {
    const key = format(slot.start, 'yyyy-MM-dd');
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{slots.length}件の空き時間が見つかりました</p>
        {selectedKeys.size > 0 && (
          <p className="text-sm text-blue-400 font-medium">{selectedKeys.size}件選択中</p>
        )}
      </div>

      <CalendarGrid
        slots={slots}
        nameMap={nameMap}
        selfName={selfName}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
      />

      {selectedKeys.size > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            Gmailで下書きを作成
          </h3>

          {/* 選択日程サマリ */}
          <div className="bg-gray-900 rounded-lg px-4 py-3 space-y-1">
            <p className="text-xs text-gray-500 mb-2">選択した候補日程</p>
            {Object.entries(groupedSelected).map(([date, daySlots]) => (
              <div key={date}>
                <p className="text-xs font-medium text-gray-300 mb-0.5">
                  {format(new Date(date + 'T00:00:00'), 'M月d日(EEE)', { locale: ja })}
                </p>
                <div className="flex flex-wrap gap-1.5 pl-2">
                  {daySlots.map((s) => (
                    <span key={slotKey(s)} className="text-xs text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded">
                      {format(s.start, 'HH:mm')}〜{format(s.end, 'HH:mm')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">宛先</label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="送り先のメールアドレスを入力"
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">件名</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {draftError && (
            <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 px-3 py-2 rounded-lg">{draftError}</p>
          )}

          {draftUrl ? (
            <div className="flex items-center gap-3 bg-emerald-900/30 border border-emerald-700 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="flex-1 text-sm font-medium text-emerald-300">下書きを作成しました</p>
              <a
                href={draftUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                Gmailで開く
              </a>
            </div>
          ) : (
            <button
              onClick={handleCreateDraft}
              disabled={creating || !toEmail}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
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
