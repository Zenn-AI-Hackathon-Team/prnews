# ---- 1. ビルドステージ ----
FROM node:20 as build

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm@10.11.0

# ルートと各ワークスペースのpackage.jsonをコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY packages/common/package.json ./packages/common/

# まずは依存関係のみをインストール（キャッシュ効率化のため）
RUN pnpm install --frozen-lockfile

# プロジェクト全体のソースコードをコピー
COPY . .

# commonパッケージをビルド
RUN PATH=$(pnpm bin):$PATH pnpm --filter @prnews/common build

# backendパッケージをビルド
RUN PATH=$(pnpm bin):$PATH pnpm --filter @prnews/backend build

# 本番稼働に必要なファイルのみを /app/deploy に集約
RUN pnpm deploy --prod --filter @prnews/backend --legacy /app/deploy


# ---- 2. 本番ステージ ----
FROM node:20-slim

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm@10.11.0

# ビルドステージから、本番稼働に必要なファイルのみをコピー
COPY --from=build /app/deploy /app

# backendディレクトリに移動
WORKDIR /app

# アプリケーションの起動
CMD [ "node", "dist/index.js" ]