# スキーマ設計ガイド

> **目的**: アプリ全体で使用する **Zod スキーマ** の定義場所・命名規則・利用ルールを明文化し、ドメイン層との責務分離を徹底する。

---

## 1. 対象エンティティ

* **User**

  * ファイル: `packages/common/src/schemas/userSchema.ts`
  * GitHub 認証で生成されるアプリ利用者

* **PullRequest**

  * ファイル: `packages/common/src/schemas/prBaseSchema.ts`
  * GitHub から取得した PR の生データ

* **PullRequestArticle**

  * ファイル: `packages/common/src/schemas/pullRequestArticleSchema.ts`
  * AI 要約や注目点を付与した解説記事

* **AuthSession**

  * ファイル: `packages/common/src/schemas/authSessionSchema.ts`
  * Firebase ID トークンのセッション追跡・ブラックリスト

---

## 2. 共通レスポンススキーマ

* **ErrorCode**: `packages/common/src/errorCodes.ts` に列挙。
* **ApiResponse<T>**: `packages/common/src/schemas/apiResponseSchema.ts` で定義。成功と失敗で同一キー構造。
* **HTTP ステータス対応表**: `packages/common/src/errorStatusMap.ts` に `ErrorCode → status` を一元管理。
* **レスポンスヘルパ**: `backend/src/utils/apiResponder.ts` で `respondSuccess / respondError` を提供。
* **フロント取り扱い**: `json.success` を判定し、`error.code` で UI 分岐。

## 3. enum 定義

```ts
// changeTypeEnum: PR 内の変更種別
"FEAT"      // 機能追加
"FIX"       // バグ修正
"REFACTOR"  // リファクタリング
"DOCS"      // ドキュメント
"TEST"      // テスト関連
"PERF"      // 性能改善
"BUILD"     // ビルド／CI
"CHORE"     // その他雑務

// categoryEnum: 注目ポイントの観点
"TECH"       // 技術的に興味深い
"RISK"       // 影響範囲が大きい
"UX"         // ユーザ体験に影響
"PERF"       // 性能面の影響
"SECURITY"   // セキュリティ観点
```

---

## 3. 命名・配置ルール

* **ファイル名**: `<entity>Schema.ts` または `<entity><Suffix>Schema.ts`
  例: `pullRequestArticleSchema.ts`
* **エクスポート名**: `<entity>Schema`
  例: `export const userSchema = ...`
* **型定義**: `export type <Entity> = z.infer<typeof <schemaName>>;`
* **説明文**: `describe()` を活用し、日本語でフィールド用途を添える。

---

## 4. レイヤ別使用ガイドライン

* **Presentation 層 (routes/middlewares)**

  * `schema.parse()` で入力バリデーション／レスポンス整形を行う。

* **Infrastructure 層 (repositories/adapters)**

  * 外部 API・DB からのデータ整形で `schema.parse()` を使う。

* **Application / Domain 層**

  * **Zod に依存しない**。
  * 必要なら Mapping 関数 (`fromPrInput`) で純粋型に変換してから利用。

> **禁止事項**: Domain 内で `zod` を直接 import しない。
