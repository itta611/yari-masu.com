# Vercel KV セットアップ手順

## 1. Vercel KVストアの作成

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. "Storage"タブをクリック
4. "Create Database"をクリック
5. "KV"を選択
6. データベース名を入力して作成

## 2. 環境変数の設定

Vercel KVを作成すると、以下の環境変数が自動的にプロジェクトに追加されます：

- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

## 3. ローカル開発環境の設定

ローカルで開発する場合は、`.env.local`ファイルを作成して環境変数を設定します：

```bash
# Vercel Dashboardから値をコピー
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

## 4. デプロイ

Vercelにデプロイすると、環境変数は自動的に設定されているため、追加の設定は不要です。

```bash
vercel deploy
```

## 使用方法

予約ダイアログで「予約する」ボタンをクリックすると：
1. 一意の予約IDが自動生成されます
2. 予約情報がVercel KVに保存されます
3. 予約IDがユーザーに表示されます

## トラブルシューティング

- エラーが発生する場合は、Vercel Dashboardで環境変数が正しく設定されているか確認してください
- ローカル環境では`.env.local`ファイルが正しく設定されているか確認してください