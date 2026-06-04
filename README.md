# 空き時間チェッカー

Googleカレンダーを使って、**自分と1人以上の相手**が同時に空いている時間帯を一覧表示するWebアプリです。ミーティングや打ち合わせの日程調整を素早く行うことができます。

## アプリの概要

「空き時間チェッカー」は、複数人の日程調整を簡単にするためのツールです。Googleアカウントでログインし、確認したい相手のメールアドレスを入力するだけで、あなたと相手の両方が空いている時間帯を自動的に検索・表示します。

バックエンドは一切不要で、すべての処理がブラウザ上で完結します。カレンダーデータは外部サーバーには送信されません。

## 機能一覧

- Googleアカウントでログイン（OAuth 2.0 implicit flow）
- 複数ユーザーのメールアドレスを入力して一括チェック
- 指定期間（最大30日）の空き時間を自動計算
- 「自分＋少なくとも1人以上が空いている」スロットを表示
- 隣接する空き時間は自動でまとめて表示（例: 9:00〜9:30 + 9:30〜10:00 → 9:00〜10:00 60分）
- 勤務時間帯（9:00〜18:00）に絞り込んで表示
- 日付ごとにグループ化して表示
- レスポンシブデザイン（スマートフォン・タブレット・PC対応）

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

#### 1-1. プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. 画面上部のプロジェクト選択ドロップダウン → **「新しいプロジェクト」** をクリック
3. プロジェクト名を入力（例: `scheduler`）→「作成」

#### 1-2. Google Calendar APIの有効化

1. 左メニュー「APIとサービス」→「ライブラリ」
2. 検索ボックスに「Google Calendar API」と入力
3. 「Google Calendar API」を選択 →「**有効にする**」をクリック

#### 1-3. OAuth同意画面の設定

1. 左メニュー「APIとサービス」→「OAuth同意画面」
2. ユーザーの種類: **外部** を選択 →「作成」
3. アプリ情報を入力:
   - アプリ名: `空き時間チェッカー`（任意）
   - ユーザーサポートメール: 自分のメールアドレス
   - デベロッパーの連絡先情報: 自分のメールアドレス
4. 「保存して次へ」→ スコープの画面で「スコープを追加または削除」をクリック
5. フィルタに `calendar.readonly` と入力し、`https://www.googleapis.com/auth/calendar.readonly` を選択して「更新」
6. 「保存して次へ」を2回クリックして完了

#### 1-4. OAuth 2.0クライアントIDの作成

1. 左メニュー「APIとサービス」→「認証情報」
2. 「**認証情報を作成**」→「**OAuthクライアントID**」
3. アプリケーションの種類: **ウェブアプリケーション**
4. 名前: `scheduler`（任意）
5. 承認済みのJavaScriptの生成元に以下を追加:
   - 開発用: `http://localhost:5173`
   - 本番用: `https://your-domain.com`（デプロイ先のURL）
6. 「作成」をクリック
7. 表示された **クライアントID**（`xxxxx.apps.googleusercontent.com` の形式）をコピー

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

### 処理フロー

```
1. Google Calendar FreeBusy API で全員の予定（busy）を一括取得
         ↓
2. 指定期間を30分単位のスロットに分割
   例: 2026-06-04 09:00〜18:00 → 18スロット
         ↓
3. 各スロットに対してフィルタリング:
   a. 勤務時間外（9:00未満 or 18:00以降）は除外
   b. 自分がbusyなら除外
   c. 相手全員がbusyなら除外（1人でも空いていれば採用）
         ↓
4. 隣接する同条件のスロットを結合
   例: 9:00-9:30(空き) + 9:30-10:00(空き) → 9:00-10:00(60分)
         ↓
5. 日付ごとにグループ化して表示
```

### 重要な判定ロジック

**「自分 AND 他の誰か一人以上が空いている」条件**

```typescript
// 自分が空いていること（必須）
if (!isSlotFree(slot, selfResult.busy)) continue;

// 相手のうち1人以上が空いていること（必須）
const freeOthers = otherResults.filter((r) => isSlotFree(slot, r.busy));
if (freeOthers.length === 0) continue;
```

**スロット結合の条件**

隣接する2つのスロットが以下の両条件を満たす場合のみ結合します:
1. 前スロットの終了時刻 === 次スロットの開始時刻
2. 空いているメンバーの集合が完全に一致している

## プライバシーについて

- カレンダーデータはブラウザ上でのみ処理され、外部サーバーには一切送信されません
- 読み取り権限（`calendar.readonly`）のみ使用します
- アクセストークンはブラウザのメモリ内にのみ保持され、ページを閉じると消去されます
- 他のユーザーのカレンダーを参照するには、そのユーザーのGoogleカレンダーが「空き/予定あり情報を他のユーザーに公開する」設定になっている必要があります

## ファイル構成

```
scheduler/
  index.html              # エントリーポイントHTML
  package.json            # 依存関係とスクリプト
  vite.config.ts          # Viteの設定
  tsconfig.json           # TypeScriptの設定
  tailwind.config.js      # Tailwind CSSの設定
  postcss.config.js       # PostCSSの設定
  .env.example            # 環境変数のサンプル
  src/
    main.tsx              # Reactのエントリーポイント
    App.tsx               # メインコンポーネント（認証・検索ロジック）
    index.css             # グローバルCSS（Tailwindディレクティブ）
    vite-env.d.ts         # Vite環境変数の型定義
    components/
      Header.tsx          # ヘッダー（ロゴ・ユーザー情報・ログアウト）
      LoginButton.tsx     # Googleログインボタン（補助コンポーネント）
      UserSelector.tsx    # メールアドレス追加・削除UI
      DateRangePicker.tsx # 期間選択UI
      ScheduleView.tsx    # 空き時間一覧表示
      FreeSlotCard.tsx    # 個別の空き時間カード
    utils/
      freebusy.ts         # FreeBusy API呼び出し・空き時間計算
      timeUtils.ts        # 時間スロット生成・フォーマットユーティリティ
    types/
      index.ts            # TypeScript型定義
```