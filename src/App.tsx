import { useState } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { format, addDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Header } from './components/Header';
import { UserSelector } from './components/UserSelector';
import { DateRangePicker } from './components/DateRangePicker';
import { ScheduleView } from './components/ScheduleView';
import { UserEntry, FreeSlot, FreeBusyResult } from './types';
import { fetchFreeBusy, computeFreeSlots } from './utils/freebusy';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function AppInner() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selfEmail, setSelfEmail] = useState('');
  const [selfName, setSelfName] = useState('');
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<FreeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const info = await res.json();
      setSelfEmail(info.email ?? '');
      setSelfName(info.name ?? info.email ?? '');
    },
    onError: () => setError('Googleログインに失敗しました'),
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
    ].join(' '),
  });

  function logout() {
    setAccessToken(null);
    setSelfEmail('');
    setSelfName('');
    setSlots([]);
    setSearched(false);
    setError('');
  }

  async function search() {
    if (!accessToken || !selfEmail) return;
    if (users.length === 0) {
      setError('1人以上追加してください');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const timeMin = startOfDay(parseISO(startDate));
      const timeMax = endOfDay(parseISO(endDate));
      const allEmails = [selfEmail, ...users.map((u) => u.email)];
      const results: FreeBusyResult[] = await fetchFreeBusy(accessToken, allEmails, timeMin, timeMax);
      const freeSlots = computeFreeSlots(selfEmail, results, timeMin, timeMax);
      setSlots(freeSlots);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '不明なエラー';
      setError(`取得に失敗しました: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">空き時間チェッカー</h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Googleアカウントでログインして、<br />
            あなたと他のメンバーの空き時間を確認しましょう。
          </p>
          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-800 border border-gray-600 rounded-xl text-sm font-medium text-gray-200 hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </button>
          <p className="mt-6 text-xs text-gray-600">
            カレンダー・コンタクト・Gmailの権限を使用します
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header userEmail={selfEmail} onLogout={logout} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 mb-6 space-y-6">
          <UserSelector users={users} onChange={setUsers} selfEmail={selfEmail} accessToken={accessToken} />
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          {error && (
            <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 px-4 py-2.5 rounded-lg">{error}</p>
          )}
          <button
            onClick={search}
            disabled={loading || users.length === 0}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            空き時間を検索
          </button>
        </div>

        {searched && (
          <ScheduleView
            slots={slots}
            nameMap={Object.fromEntries(users.map((u) => [u.email, u.name]))}
            selfEmail={selfEmail}
            selfName={selfName}
            accessToken={accessToken}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AppInner />
    </GoogleOAuthProvider>
  );
}
