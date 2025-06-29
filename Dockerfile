# ---- 1. ビルドステージ ----
FROM node:20 as build

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm

# ルートと各ワークスペースのpackage.jsonをコピー
COPY package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY packages/common/package.json ./packages/common/

# まずは依存関係のみをインストール（キャッシュ効率化のため）
RUN pnpm install --frozen-lockfile

# プロジェクト全体のソースコードをコピー
COPY . .

# backendとその依存関係( @prnews/common)をビルド
RUN pnpm --filter @prnews/backend... build


# ---- 2. 本番ステージ ----
FROM node:20-slim

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm

# ビルドステージから、本番稼働に必要なファイルのみをコピー
# pnpm deployコマンドは、指定したパッケージ（backend）の実行に必要な
# ファイルとnode_modulesを再構築してくれます。
COPY --from=build /app .

# backendディレクトリに移動
WORKDIR /app/backend

# アプリケーションの起動
CMD [ "npm", "start" ]