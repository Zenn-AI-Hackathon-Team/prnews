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

## 3. お気に入りリポジトリ機能

- **POST /users/me/favorite-repositories**
    - 認証: 必須
    - 入力: JSON `{ owner: string, repo: string }`
    - 出力: `FavoriteRepository` オブジェクト
    - GitHubリポジトリ存在確認あり。存在しない場合は `GITHUB_REPO_NOT_FOUND` エラー。
    - 既に登録済みの場合は200、初回登録時は201。
    - レスポンス例:

      ```json
      {
        "success": true,
        "data": {
          "id": "uuid",
          "userId": "uuid",
          "githubRepoId": 123456,
          "repositoryFullName": "owner/repo",
          "owner": "owner",
          "repo": "repo",
          "registeredAt": "2024-06-08T12:34:56Z"
        },
        "message": "お気に入り登録が完了しました"
      }
      ```

- **GET /users/me/favorite-repositories**
    - 実装: 未実装（2024/6/8時点）
    - 今後の拡張候補として記載。

- **DELETE /users/me/favorite-repositories**
    - 実装: 未実装（2024/6/8時点）
    - 今後の拡張候補として記載。

---

## 4. Pull Request 解説記事・いいね機能

- **POST /articles/{articleId}/language/{langCode}/like**
    - 認証: 必須
    - 入力: なし
    - 出力: `{ message: string, likeCount: number, alreadyLiked: boolean }`
    - 記事・言語が存在しない場合は `ARTICLE_NOT_FOUND` エラー。
    - レスポンス例:

      ```json
      {
        "success": true,
        "data": {
          "message": "いいねしました",
          "likeCount": 5,
          "alreadyLiked": false
        }
      }
      ```

- **DELETE /articles/{articleId}/language/{langCode}/like**
    - 認証: 必須
    - 入力: なし
    - 出力: `{ likeCount: number }`
    - 記事・言語が存在しない場合は `ARTICLE_NOT_FOUND` エラー。
    - レスポンス例:

      ```json
      {
        "success": true,
        "data": {
          "likeCount": 4
        }
      }
      ```

- **GET /users/me/liked-articles**
    - 認証: 必須
    - クエリ: `lang`, `limit`, `offset`, `sort`
    - 出力: `{ data: LikedArticleInfo[], pagination: Pagination }`
    - レスポンス例:

      ```json
      {
        "success": true,
        "data": {
          "data": [
            {
              "articleId": "uuid",
              "languageCode": "ja",
              "likedAt": "2024-06-08T12:34:56Z",
              "aiGeneratedTitle": "AI生成タイトル",
              "repositoryFullName": "owner/repo",
              "prNumber": 42
            }
          ],
          "pagination": {
            "totalItems": 1,
            "limit": 10,
            "offset": 0
          }
        }
      }
      ```

---

## 5. いいね数ランキング

- **GET /ranking/articles/likes**
    - 認証: 不要
    - クエリ: `period`, `language`, `limit`, `offset`
    - 出力: `{ data: RankedArticleInfo[], pagination: Pagination }`
    - レスポンス例:

      ```json
      {
        "success": true,
        "data": {
          "data": [
            {
              "rank": 1,
              "articleId": "uuid",
              "languageCode": "ja",
              "aiGeneratedTitle": "AI生成タイトル",
              "repositoryFullName": "owner/repo",
              "prNumber": 42,
              "likeCount": 10
            }
          ],
          "pagination": {
            "totalItems": 1,
            "limit": 10,
            "offset": 0
          }
        }
      }
      ```

---

## 6. Pull Request 本体取得（キャッシュ）

-   **GET /repos/:owner/:repo/pulls/:number**

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

## 7. スキーマ定義（抜粋）

### FavoriteRepository
```ts
{
  id: string; // uuid
  userId: string; // uuid
  githubRepoId: number;
  repositoryFullName: string; // owner/repo
  owner: string;
  repo: string;
  registeredAt: string; // ISO8601
}
```

### ArticleLike
```ts
{
  id: string; // uuid
  userId: string; // uuid
  articleId: string; // uuid
  languageCode: string; // 2文字
  likedAt: string; // ISO8601
}
```

### LikedArticleInfo
```ts
{
  articleId: string; // uuid
  languageCode: string; // 2文字
  likedAt: string; // ISO8601
  aiGeneratedTitle: string;
  repositoryFullName: string;
  prNumber: number;
}
```

### RankedArticleInfo
```ts
{
  rank: number;
  articleId: string; // uuid
  languageCode: string; // 2文字
  aiGeneratedTitle: string;
  repositoryFullName: string;
  prNumber: number;
  likeCount: number;
}
```

### Pagination
```ts
{
  totalItems: number;
  limit: number;
  offset: number;
}
```

### User
```ts
{
  id: string; // uuid
  githubUserId: number;
  githubUsername: string;
  githubDisplayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  language: string; // 2文字, デフォルトja
  createdAt?: string;
  updatedAt?: string;
}
```

### PullRequestArticle
```ts
{
  // ...PullRequestの各フィールド
  id: string; // uuid
  contents?: {
    [lang: string]: {
      aiGeneratedTitle: string;
      backgroundAndPurpose?: string;
      mainChanges?: Array<{ fileName: string; changeTypes: string[]; description: string; }>;
      notablePoints?: Array<{ categories: string[]; point: string; }>;
      summaryGeneratedAt: string;
      likeCount: number;
    }
  };
  createdAt?: string;
  updatedAt?: string;
}
```

---
