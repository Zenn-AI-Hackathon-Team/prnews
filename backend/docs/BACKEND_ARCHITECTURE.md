# バックエンドアーキテクチャガイド

> **対象範囲**: 本ドキュメントは **Hono** で構築したバックエンド実装についてまとめる。クリーンアーキテクチャに則り、認証は **Firebase Auth（GitHub プロバイダ）**、LLM 呼び出しには **Gemini** を利用する。フロントエンドやインフラ、CI/CD など全体横断の内容は別ドキュメントで扱う。

---

## 1. 目的と設計原則

* **関数指向（クラスレス）**: 副作用を外部に追い出し、依存性は高階関数で注入する。
* **クリーンアーキテクチャ**: 依存関係は Presentation → Application → Domain ←・Infrastructure の一方向のみ。
* **テスト容易性**: 各レイヤをモック差し替え可能にし、Deno / Node / Edge どこでも動くコードを目指す。
* **セキュリティ優先**: すべてのリクエストで Firebase ID トークンを検証し、最小権限のサービスアカウントを使う。

---

## 2. ディレクトリ構成 (`backend/src/`)

```text
backend/
└─ src/
   ├─ presentation/         # HTTP 層 (Hono)
   │   ├─ routes/           #   user.ts, pr.ts …
   │   └─ middlewares/      #   auth.ts, error.ts
   │
   ├─ application/          # ユースケース層 (純関数)
   │   ├─ userService.ts
   │   └─ prService.ts
   │
   ├─ domain/               # エンティティ & 値オブジェクト
   │   └─ pr.ts, user.ts
   │
   ├─ infrastructure/       # 外部とのやり取り
   │   ├─ repositories/     #   prRepoFirestore.ts …
   │   └─ adapters/         #   githubClient.ts, geminiClient.ts
   │
   └─ config/               # DI 初期化 & 環境変数
```

### レイヤ責務（詳細）

* **Presentation（HTTP 層）**

  * ルーティング定義・入力バリデーション・レスポンス生成を担当。
  * 認証・エラーハンドリングなど共通処理はミドルウェアとして分離。
  * 外部フォーマット（JSON, HTTP ヘッダ）と内部 DTO の変換をここで終わらせ、下位レイヤはフォーマットを意識しない。

* **Application（ユースケース層）**

  * 1 つのユースケース＝1 関数を基本とし、フロー制御だけを行う。
  * ビジネスロジック実行前後のトランザクション管理やリトライなどもここで実装。
  * Domain を呼び出し、副作用が必要な場合は依存として受け取った Repository / Adapter 経由で行う。

* **Domain（ドメイン層）**

  * エンティティ・値オブジェクト・ドメインサービスを純関数で表現。
  * 外部 I/O・ライブラリ依存を一切持たず、テストは同期的に完結。
  * ビジネスルールが変更された場合はまずこの層に手を入れる。

* **Infrastructure（インフラ層）**

  * DB / 外部 API / メッセージング / LLM など、副作用を伴う実装を配置。
  * Domain への依存はなく、型は共通 DTO を介してやり取り。
  * 一つのインターフェースに対し、開発用モック・本番用実装など複数の実体を用意し差し替え可能にする。

---

## 3. リクエストライフサイクル（トークン中心）

* クライアントは **Authorization: Bearer \<Firebase ID トークン>** を付けてリクエストを送信する。
* `authMiddleware` が **verifyIdToken()** でトークンを検証。不正・期限切れの場合は即座に **401 Unauthorized** を返す。
* 検証成功時、ミドルウェアは `ctx.set('user', decodedToken)` に **UID・メール・カスタムクレーム** など必要最小限の認証情報を保存し、次のハンドラへ渡す。
* 以降のルート・サービス・ドメイン層は `ctx.get('user')` を参照するだけで、トークン自体を再解釈せずに認可判定やデータ所有者チェックを行う。

---
