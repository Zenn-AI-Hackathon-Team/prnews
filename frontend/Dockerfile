# 1. ビルドステージ
FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
# pnpm-workspace.yaml, .npmrc, package.json, pnpm-lock.yaml などを先にコピー
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
# 各ワークスペースのpackage.jsonをコピー
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
# 例: commonパッケージがある場合
COPY packages/common/package.json ./packages/common/ 


# 依存関係をインストール
RUN pnpm install --frozen-lockfile
# プロジェクト全体のソースコードをコピー
COPY . .

# frontendアプリをビルド
RUN pnpm --filter frontend build

# 2. プロダクションステージ
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# ビルドステージから、standaloneモードで出力された必要なファイルのみをコピー
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

# ポートを開放
EXPOSE 8080
ENV PORT=8080

# アプリケーションを起動
# standaloneモードの場合、起動ファイルはserver.jsになります
CMD ["node", "server.js"]
