import { GoogleLogin } from '@react-oauth/google';

interface LoginButtonProps {
  onSuccess: (token: string, email: string) => void;
  onError: () => void;
}

export function LoginButton({ onSuccess, onError }: LoginButtonProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-9 h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">空き時間チェッカー</h2>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Googleアカウントでログインして、<br />
          あなたと他のメンバーの空き時間を確認しましょう。
        </p>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              // Decode JWT to get email
              const token = credentialResponse.credential ?? '';
              const payload = JSON.parse(atob(token.split('.')[1]));
              // We need access token for Calendar API, use implicit flow
              onSuccess(token, payload.email as string);
            }}
            onError={onError}
            useOneTap
          />
        </div>
        <p className="mt-6 text-xs text-gray-400">
          カレンダーの空き/予定情報のみ読み取ります
        </p>
      </div>
    </div>
  );
}
