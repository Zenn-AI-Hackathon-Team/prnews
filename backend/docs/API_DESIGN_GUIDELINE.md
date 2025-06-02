```md
# API設計ガイドライン

## 1. はじめに

一貫性・予測可能性・型安全性を備えた API を構築し、開発効率とメンテナンス性を高めることを目的とする。実装は **Hono**・**Zod**・**Hono Client** を中心に行う。

---

## 2. 共通レスポンススキーマ

全エンドポイントは共通レスポンススキーマに準拠し、クライアント側のハンドリングを単純化する。

### 2.1 成功レスポンス `SuccessResponse`

'''typescript
// packages/common/src/schemas/apiResponseSchema.ts
import { z } from 'zod';

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true).describe('処理成功時は常に true'),
    data: dataSchema.describe('レスポンス本体'),
    message: z.string().optional().describe('成功メッセージ（任意）'),
  });

export type SuccessResponse<T> = z.infer<ReturnType<typeof successResponseSchema<T>>>;
'''

### 2.2 エラーレスポンス `ErrorResponse`

'''typescript
// packages/common/src/schemas/apiResponseSchema.ts
import { z } from 'zod';

export const errorResponseSchema = z.object({
  success: z.literal(false).describe('処理失敗時は常に false'),
  error: z.object({
    code: z.string().describe("アプリ固有のエラーコード (例: 'VALIDATION_ERROR')"),
    message: z.string().describe('開発者／ユーザー向けメッセージ'),
    details: z.any().optional().describe('追加情報（任意）'),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
'''

### 2.3 HTTP ステータスコードと `error.code` の使い分け

- **200 OK** – 正常取得・更新
- **201 Created** – リソース新規作成成功
- **400 Bad Request** – クライアントリクエスト不正 (`VALIDATION_ERROR`)
- **401 Unauthorized** – 未認証／トークン不正 (`UNAUTHENTICATED`)
- **403 Forbidden** – 認証済みだが権限不足 (`FORBIDDEN`)
- **404 Not Found** – リソースが存在しない (`NOT_FOUND`)
- **422 Unprocessable Entity** – バリデーション失敗 (`VALIDATION_ERROR`)
- **500 Internal Server Error** – サーバ内部エラー (`INTERNAL_SERVER_ERROR`)

---

## 3. API エンドポイント設計原則

* **命名規則**: URL パスは複数形ケバブケースでリソースを表す（例: `/users`, `/pull-request-articles`）。
* **HTTP メソッド**:
  * `GET` – 取得
  * `POST` – 新規作成
  * `PATCH` – 部分更新
  * `DELETE` – 削除
* **レスポンス**: 本ガイドライン第 2 章の共通スキーマに準拠。
* **認証**: `Authorization: Bearer <token>` ヘッダに Firebase などで取得した ID トークンを送る。
* **認可**: ハンドラ内でリソースオーナーシップ・権限を検証する。

---

## 4. 共通レスポンスヘルパー

### 4.1 バックエンド (Hono) 実装例

'''typescript
// backend/src/utils/apiResponder.ts
import { Context } from 'hono';
import { SuccessResponse, ErrorResponse } from '@prnews/common';

export const respondSuccess = <T>(c: Context, data: T, status = 200, message?: string) =>
  c.json<SuccessResponse<T>>({ success: true, data, message }, status);

export const respondError = (
  c: Context,
  code: ErrorResponse['error']['code'],
  message: string,
  status: number,
  details?: unknown,
) =>
  c.json<ErrorResponse>({ success: false, error: { code, message, details } }, status);
'''

### 4.2 フロントエンド (Hono Client) 例

'''typescript
// frontend/src/services/apiClient.ts
import { hc } from 'hono/client';
import type { AppType } from '~/backend/src';
import type { SuccessResponse, ErrorResponse, User } from '@prnews/common';

type UserApiResponse = SuccessResponse<User> | ErrorResponse;

const client = hc<AppType>('/');

export async function fetchMyProfile(): Promise<User | null> {
  const res = await client.api.users.me.$get();
  const json = (await res.json()) as UserApiResponse;

  if (!json.success) {
    console.error(`API Error(${json.error.code}): ${json.error.message}`);
    return null;
  }
  return json.data;
}
'''

