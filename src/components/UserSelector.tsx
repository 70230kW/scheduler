import { useState } from 'react';
import { UserEntry } from '../types';
import { lookupContactName } from '../utils/contacts';

interface UserSelectorProps {
  users: UserEntry[];
  onChange: (users: UserEntry[]) => void;
  selfEmail: string;
  accessToken: string;
}

export function UserSelector({ users, onChange, selfEmail, accessToken }: UserSelectorProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState('');

  async function handleEmailBlur() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    if (name) return;
    setLooking(true);
    const found = await lookupContactName(accessToken, trimmed);
    if (found) setName(found);
    setLooking(false);
  }

  function addUser() {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail) { setError('メールアドレスを入力してください'); return; }
    if (!trimmedName) { setError('名前を入力してください'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }
    if (trimmedEmail === selfEmail) {
      setError('自分自身のメールアドレスは追加不要です');
      return;
    }
    if (users.some((u) => u.email === trimmedEmail)) {
      setError('すでに追加済みです');
      return;
    }
    onChange([...users, { id: crypto.randomUUID(), email: trimmedEmail, name: trimmedName }]);
    setEmail('');
    setName('');
    setError('');
  }

  function removeUser(id: string) {
    onChange(users.filter((u) => u.id !== id));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        チェックする相手
      </label>
      <div className="flex gap-2 mb-1">
        <div className="flex-1 relative">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            onBlur={handleEmailBlur}
            onKeyDown={(e) => e.key === 'Enter' && addUser()}
            placeholder="メールアドレス"
            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 placeholder-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {looking && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && addUser()}
          placeholder={looking ? '検索中...' : '名前'}
          className="w-32 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={addUser}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          追加
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-2">メアド入力後、Googleコンタクトに登録済みの場合は名前が自動補完されます</p>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      {users.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {users.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full"
            >
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">
                {user.name[0]}
              </span>
              {user.name}
              <button
                onClick={() => removeUser(user.id)}
                className="ml-1 text-blue-400 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
