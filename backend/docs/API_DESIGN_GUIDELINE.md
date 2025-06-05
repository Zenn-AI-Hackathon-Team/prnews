# API設計ガイドライン

本ガイドラインは **Hono + Zod + Hono Client** を用いた REST API 設計方針を示す。**成功・失敗で同一キー構造**を持つ `ApiResponse<T>` を正式採用し、`error.code` は列挙型で管理する。また、`ErrorCode` と HTTP ステータスコードを 1 か所でマッピングし、実装の重複を排除する。

---

## 1. はじめに

一貫性・予測可能性・型安全性を備えた API を構築し、開発効率とメンテナンス性を高めることを目的とする。実装は **Hono**・**Zod**・**Hono Client** を中心に行う。

---

## 2. 共通レスポンススキーマ

### 2.1 エラーコードの列挙型

```typescript
// packages/common/src/errorCodes.ts
export const ErrorCode = {
  VALIDATION_ERROR:      'VALIDATION_ERROR',
  UNAUTHENTICATED:       'UNAUTHENTICATED',
  FORBIDDEN:             'FORBIDDEN',
  NOT_FOUND:             'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  GITHUB_REPO_NOT_FOUND: 'GITHUB_REPO_NOT_FOUND',
  ARTICLE_NOT_FOUND:     'ARTICLE_NOT_FOUND',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
```

### 2.2 ApiResponse 型と Zod スキーマ

```typescript
// packages/common/src/schemas/apiResponseSchema.ts
import { z } from 'zod';
import { ErrorCode } from '../errorCodes';

// 成功レスポンス
const successPart = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data:    dataSchema,
    message: z.string().optional(),
  });

// 失敗レスポンス
const errorPart = z.object({
  success: z.literal(false),
  error: z.object({
    code:    z.enum([...Object.values(ErrorCode)] as [ErrorCode, ...ErrorCode[]]),
    details: z.any().optional(),
  }),
  message: z.string().optional(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion('success', [successPart(dataSchema), errorPart]);

export type ApiResponse<T> = z.infer<ReturnType<typeof apiResponseSchema<T>>>;
```

**プロパティ**

* `success` (`boolean`): `true` = 成功 / `false` = 失敗
* `data` (`T`, 成功時のみ): レスポンス本体
* `error` (`{ code, details? }`, 失敗時のみ): アプリ固有のエラー情報
* `message` (`string?`): UI 向けの補助メッセージ

---

## 3. ErrorCode ↔ HTTP ステータスのマッピング

1 ファイルにマッピング表を置き、**`respondError` で自動変換**する。

```typescript
// packages/common/src/errorStatusMap.ts
import { ErrorCode } from './errorCodes';

export const errorStatusMap: Record<ErrorCode, number> = {
  VALIDATION_ERROR:      422,
  UNAUTHENTICATED:       401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  INTERNAL_SERVER_ERROR: 500,
  GITHUB_REPO_NOT_FOUND: 404,
  ARTICLE_NOT_FOUND:     404,
};
```

> **ポイント**
>
> * ステータス運用を変更したい場合はこのファイルだけ直せば良い。
> * 未定義コードは 500 にフォールバックさせるなど、デフォルト値を決めておく。

---

## 4. 共通レスポンスヘルパ

```typescript
// backend/src/utils/apiResponder.ts
import { Context } from 'hono';
import type { ApiResponse, ErrorCode } from '@prnews/common';
import { errorStatusMap } from '@prnews/common';

/** 成功レスポンス */
export const respondSuccess = <T>(
  c: Context,
  data: T,
  status: number = 200,
  message?: string,
) =>
  c.json<ApiResponse<T>>({ success: true, data, message }, status);

/** 失敗レスポンス（ステータス自動設定） */
export const respondError = (
  c: Context,
  code: ErrorCode,
  message?: string,
  details?: unknown,
  statusOverride?: number,  // 例外的に上書きしたいときだけ指定
) => {
  const status = statusOverride ?? errorStatusMap[code] ?? 500;
  return c.json<ApiResponse<never>>(
    { success: false, error: { code, details }, message },
    status,
  );
};
```

---

## 5. フロントエンド利用例 (Hono Client)

```typescript
// frontend/src/services/apiClient.ts
import { hc } from 'hono/client';
import type { AppType } from '~/backend/src';
import type { ApiResponse, ErrorCode, User } from '@prnews/common';

const client = hc<AppType>('/');

export async function fetchMyProfile(): Promise<User | null> {
  const res  = await client.api.users.me.$get();
  const json = (await res.json()) as ApiResponse<User>;

  if (!json.success) {
    switch (json.error.code) {
      case ErrorCode.UNAUTHENTICATED:
        // ログイン画面へ
        break;
      case ErrorCode.VALIDATION_ERROR:
        // フォームエラー表示
        break;
      default:
        alert(json.message ?? 'Unexpected error');
    }
    return null;
  }

  return json.data;
}
```

---

## 6. 運用ガイド

1. **ErrorCode の追加**
   `packages/common/src/errorCodes.ts` に定義し、`errorStatusMap` に対応ステータスを追加する。
2. **ステータスの特殊扱い**
   同じ `ErrorCode` で複数ステータスを使い分けたい場合は、`respondError` の `statusOverride` 引数で上書きする。
3. **バリデーション失敗の details**
   `details` を `[{ field: string; reason: string }]` の形で返すと、クライアントのフォームハンドリングが容易になる。
4. **ページネーション付き配列レスポンス**
   `GET /users/me/liked-articles` や `GET /ranking/articles/likes` など、配列＋メタデータ（ページネーション等）を返す場合は、
   ```json
   {
     "success": true,
     "data": {
       "data": [ ... ],
       "pagination": { "totalItems": 100, "limit": 10, "offset": 0 }
     }
   }
   ```
   のような形式を推奨する。
5. **言語指定クエリパラメータ**
   `lang` または `language` を2文字コードで統一する。

---
