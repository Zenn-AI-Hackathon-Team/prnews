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
RUN ls -R /app/backend


# ---- 2. 本番ステージ ----
FROM node:20-slim

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm@10.11.0

# ルートと各ワークスペースのpackage.json, pnpm-lock.yaml, pnpm-workspace.yamlをコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# backendとcommonのソースコードとビルド済み成果物をコピー



COPY --from=build /app/backend/dist /app/backend/dist

RUN pnpm install --prod --ignore-scripts

# backendディレクトリに移動
WORKDIR /app/backend

# アプリケーションの起動
CMD [ "node", "dist/index.js" ]