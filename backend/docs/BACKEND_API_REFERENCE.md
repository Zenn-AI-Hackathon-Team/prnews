# バックエンド API 一覧

> **目的**: 実装予定のエンドポイントを列挙し、**ルート／HTTP メソッド／認証要否／入出力スキーマ／典型的レスポンス例／主なユースケース**をまとめる。実際の JSON 形式は `ApiResponse<T>` ガイドラインに準拠する。

---

## 0. 共通事項

-   ルートは原則 **プレフィックスなし**（例: `/healthz`）。将来バージョニングが必要になった場合は `/v1` を先頭に追加して互換性を維持する。
-   すべてのレスポンスは `<200|4xx|5xx> + ApiResponse<T>` 形式で返却。
-   認証が必要なルートでは **`Authorization: Bearer <ID_TOKEN>`** を必須とする。ID トークンの検証は `authMiddleware` が担当。
-   エラーハンドリングは `respondError(code)` を用い、`ErrorCode` とステータスは `errorStatusMap` で一元管理。

---

## 1. ヘルスチェック

-   **GET /healthz**

    -   認証: 不要
    -   入力: なし
    -   出力スキーマ: `{ ok: boolean }`
    -   典型レスポンス例（成功）:

        ```json
        { "success": true, "data": { "ok": true } }
        ```

    -   用途: コンテナ／ロードバランサの liveness・readiness probe。

---

## 2. 認証・セッション

### 2‑1. 現在のユーザー取得

-   **GET /users/me**

    -   認証: 必須
    -   入力: なし
    -   出力スキーマ: `User`（`id`, `githubUsername`, `avatarUrl`, `language` など）
    -   典型レスポンス例（成功）:

        ```json
        {
        	"success": true,
        	"data": {
        		"id": "5f8c9c1d-…",
        		"githubUsername": "octocat",
        		"avatarUrl": "https://avatars.githubusercontent.com/u/1?v=4",
        		"language": "ja"
        	}
        }
        ```

    -   用途: フロントのユーザーダッシュボード初期読込。

### 2‑2. ログアウト（トークン無効化）

-   **POST /auth/logout**

    -   認証: 必須
    -   入力: なし
    -   出力: `{}`（空オブジェクト）
    -   典型レスポンス例（成功）:

        ```json
        { "success": true, "data": {}, "message": "Logged out" }
        ```

    -   処理: `AuthSession.revokedAt` を現在時刻で更新し、以降のリクエストを 401 で拒否。

### 2‑3. サインアップ

-   **POST /auth/signup**

    -   認証: 必須
    -   入力: `{ language?: string }`（2文字言語コード、省略時は"ja"）
    -   出力スキーマ: `User`
    -   備考: サインアップ時に希望言語を指定可能。未指定時は日本語（ja）で登録。

---

## 3. Pull Request 取り込み

### 3‑1. GitHub から PR を保存

-   **POST /repos/\:owner/\:repo/pulls/\:number/ingest**

    -   認証: 必須
    -   入力: パスパラメータのみ
    -   処理:

        1. GitHub REST API で PR メタ・diff・コメントを取得。
        2. `PullRequest` として保存（既存なら更新）。

    -   出力スキーマ: `PullRequest`
    -   典型レスポンス例（成功）:

        ```json
        {
        	"success": true,
        	"data": {
        		"id": "uuid",
        		"prNumber": 42,
        		"repository": "acme/widgets",
        		"title": "feat: add new widget",
        		"authorLogin": "alice",
        		"createdAt": "2025-06-04T12:34:56Z"
        	}
        }
        ```

---

## 4. Pull Request 解説記事

### 4‑1. AI 要約生成（オンデマンド）

-   **POST /repos/\:owner/\:repo/pulls/\:number/article**

    -   認証: 必須
    -   入力: なし
    -   処理:

        1. 既存 `PullRequest` を取得（ない場合は 404）。
        2. Gemini で diff を要約し、`PullRequestArticle` を生成・保存。

    -   出力スキーマ: `PullRequestArticle`
    -   典型レスポンス例（成功）:

        ```json
        {
        	"success": true,
        	"data": {
        		"id": "uuid",
        		"prNumber": 42,
        		"repository": "acme/widgets",
        		"title": "feat: add new widget",
        		"aiGeneratedTitle": "✨ 新しいウィジェット機能を追加",
        		"summaryGeneratedAt": "2025-06-04T13:00:00Z"
        	}
        }
        ```

    -   レイテンシが高い場合は 202 を返し、WebSocket かポーリングで完了を通知する拡張も検討。

### 4‑2. 解説記事の取得

-   **GET /repos/\:owner/\:repo/pulls/\:number/article**

    -   認証: 必須
    -   入力: なし
    -   出力スキーマ: `PullRequestArticle`
    -   典型レスポンス例（成功）:

        ```json
        {
        	"success": true,
        	"data": {
        		"id": "uuid",
        		"prNumber": 42,
        		"repository": "acme/widgets",
        		"aiGeneratedTitle": "✨ 新しいウィジェット機能を追加",
        		"mainChanges": [
        			{
        				"fileName": "src/widget.ts",
        				"changeType": "FEAT",
        				"description": "Widget クラスを追加"
        			}
        		],
        		"summaryGeneratedAt": "2025-06-04T13:00:00Z"
        	}
        }
        ```

    -   失敗時: 記事未生成なら `NOT_FOUND`。

---

## 5. Pull Request 本体取得（キャッシュ）

-   **GET /repos/\:owner/\:repo/pulls/\:number**

    -   認証: 必須
    -   入力: なし
    -   出力スキーマ: `PullRequest`
    -   典型レスポンス例（成功）:

        ```json
        {
        	"success": true,
        	"data": {
        		"id": "uuid",
        		"prNumber": 42,
        		"repository": "acme/widgets",
        		"title": "feat: add new widget",
        		"authorLogin": "alice",
        		"createdAt": "2025-06-04T12:34:56Z"
        	}
        }
        ```

    -   メモ: GitHub API レート制限対策として DB キャッシュを優先。`?refresh=true` で強制更新を許可する予定。

---
