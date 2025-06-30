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
RUN cd packages/common && pnpm run build && cd ../..

# backendパッケージをビルド
RUN cd backend && pnpm run build && cd ..
RUN ls -R /app/backend/dist


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
CMD [ "node", "backend/dist/src/index.js" ]