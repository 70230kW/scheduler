# 空き時間チェッカー

Googleカレンダーを使って、**自分と1人以上の相手**が同時に空いている時間帯を一覧表示するWebアプリです。

## 機能

- Googleアカウントでログイン（OAuth 2.0）
- 複数ユーザーのメールアドレスを入力して一括チェック
- 指定期間（最大30日）の空き時間を自動計算
- 「自分＋少なくとも1人以上が空いている」スロットを表示
- 隣接する空き時間は自動でまとめて表示
- 勤務時間帯（9:00〜18:00）に絞り込んで表示

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 18 + TypeScript |
| ビルドツール | Vite |
| スタイリング | Tailwind CSS |
| 認証 | Google OAuth 2.0（@react-oauth/google） |
| API | Google Calendar FreeBusy API |
| 日付処理 | date-fns |

## セットアップ

### 1. Google Cloud Console でOAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. プロジェクトを作成（または既存を選択）
3. **APIとサービス → ライブラリ** から「Google Calendar API」を有効化
4. **APIとサービス → 認証情報** を開く
5. **認証情報を作成 → OAuthクライアントID** をクリック
6. アプリケーションの種類：**ウェブアプリケーション**
7. 承認済みのJavaScript生成元に以下を追加：
   - `http://localhost:5173`（開発用）
   - デプロイ先のURL（本番用）
8. 作成後に表示される **クライアントID** をコピー

> **注意**: OAuth同意画面の設定も必要です。スコープに `https://www.googleapis.com/auth/calendar.readonly` を追加してください。

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を開き、取得したクライアントIDを設定：

```
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id-here
```

### 3. 依存パッケージのインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## 使い方

1. **Googleでログイン** ボタンをクリックし、カレンダー読み取り権限を許可
2. **チェックする相手のメールアドレス** を入力して「追加」（複数可）
3. **期間** を設定（デフォルトは今日から1週間）
4. **空き時間を検索** をクリック
5. 自分と1人以上が空いているスロットが日付ごとに表示されます

## ビルド・デプロイ

### ビルド

```bash
npm run build
```

`dist/` フォルダに静的ファイルが生成されます。

### Vercel へのデプロイ

1. [Vercel](https://vercel.com/) にリポジトリを接続
2. 環境変数 `VITE_GOOGLE_CLIENT_ID` を設定
3. デプロイ後のURLをGoogle Cloud ConsoleのJavaScript生成元に追加

### Netlify へのデプロイ

1. [Netlify](https://netlify.com/) にリポジトリを接続
2. ビルドコマンド: `npm run build`、公開ディレクトリ: `dist`
3. 環境変数 `VITE_GOOGLE_CLIENT_ID` を設定
4. デプロイ後のURLをGoogle Cloud ConsoleのJavaScript生成元に追加

## アルゴリズムの仕組み

```
1. Google Calendar FreeBusy API で全員の予定（busy）を取得
2. 指定期間を30分単位のスロットに分割
3. 各スロットについて：
   a. 自分が空いているか確認
   b. 他のユーザーのうち1人以上が空いているか確認
   c. 両条件を満たすスロットを「空き」と判定
4. 隣接する空きスロットを連結して表示
```

勤務時間外（9:00より前・18:00以降）のスロットは自動的に除外されます。

## プライバシーについて

- カレンダーデータはブラウザ上でのみ処理され、外部サーバーには送信されません
- 読み取り権限（`calendar.readonly`）のみ使用します
- アクセストークンはセッション内でのみ保持されます