# ---- 1. ビルドステージ ----
FROM node:20 as build

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm@10.11.0

# ルートと各ワークスペースのpackage.jsonをコピー
COPY package.json pnpm-lock.yaml ./
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


# ---- 2. 本番ステージ ----
FROM node:20-slim

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm@10.11.0

# ビルドステージから、本番稼働に必要なファイルのみをコピー
# pnpm deployコマンドは、指定したパッケージ（backend）の実行に必要な
# ファイルとnode_modulesを再構築してくれます。
COPY --from=build /app .

# backendディレクトリに移動
WORKDIR /app/backend

# アプリケーションの起動
CMD [ "npm", "start" ]