# PRNews

## 🚀 セットアップ

1.  リポジトリをクローン
    ```bash
    git clone https://github.com/Zenn-AI-Hackathon-Team/prnews.git
    cd prnews
    ```
2.  `pnpm` をインストール (まだの場合)
    ```bash
    npm install -g pnpm
    ```
3.  依存関係をインストール
    ```bash
    pnpm install
    ```

---

## サーバー起動 (開発モード)

### フロントエンドとバックエンドの同時起動

以下のコマンドで、フロントエンドとバックエンドを同時に開発モードで起動します。

```bash
pnpm run dev
```

* フロントエンド: `http://localhost:3000`
* バックエンド: `http://localhost:8080`

### フロントエンド・バックエンドの個別起動

特定のサービスのみを起動したい場合は、以下のコマンドを使用します。

* **フロントエンドのみ起動:**
    ```bash
    pnpm --filter frontend run dev
    ```
    または、`frontend` ディレクトリに移動して以下を実行します。
    ```bash
    cd frontend
    pnpm run dev
    ```

* **バックエンドのみ起動:**
    ```bash
    pnpm --filter backend run dev
    ```
    または、`backend` ディレクトリに移動して以下を実行します。
    ```bash
    cd backend
    pnpm run dev
    ```

---

## ✨ 主要な開発コマンド

### Biome (フォーマット & リント)

```bash
# コードをフォーマット
pnpm run format

# コードをリント (問題があれば自動修正)
pnpm run lint

# フォーマットとリントをまとめて実行
pnpm run check
```
*コミット前に自動で行われるので基本しなくていいです。*

### Husky (Gitフック)

* コミット前にBiomeによるチェックと、特定ブランチへの直接コミット制限が自動的に行われます。
* 設定: `.husky/pre-commit`

---

## 🛡️ Husky（Gitフック）によるプロテクトを一時的に解除したい場合

Huskyによるコミット前チェックやブランチ保護を一時的に無効化したい場合は、`--no-verify` オプションを付けてコミットやプッシュを実行してください。

```bash
git commit --no-verify -m "your message"
```

---

## 📁 ディレクトリ構造 (主要部分)

```
.
├── backend/         # Hono バックエンド
├── frontend/        # Next.js フロントエンド
├── packages/        # プロジェクト全体で共通しているコード
│   └── common/
├── pnpm-workspace.yaml # pnpm ワークスペース定義
└── package.json     # ルート設定・スクリプト
```
