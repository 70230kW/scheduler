import { useState } from 'react';
import { UserEntry } from '../types';

interface UserSelectorProps {
  users: UserEntry[];
  onChange: (users: UserEntry[]) => void;
  selfEmail: string;
}

export function UserSelector({ users, onChange, selfEmail }: UserSelectorProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        チェックする相手
      </label>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && addUser()}
          placeholder="名前（例: 田中様）"
          className="w-36 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && addUser()}
          placeholder="メールアドレス"
          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={addUser}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          追加
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      {users.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
