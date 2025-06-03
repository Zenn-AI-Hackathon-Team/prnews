import { z } from "zod";
import { pullRequestSchema } from "./prBaseSchema";

const changeTypeEnum = z.enum([
	"FEAT", // 機能追加
	"FIX", // バグ修正
	"REFACTOR", // リファクタ
	"DOCS", // ドキュメント
	"TEST", // テスト関連
	"PERF", // 性能改善
	"BUILD", // ビルド／CI
	"CHORE", // その他雑務
]);

// categoryEnum
const categoryEnum = z.enum([
	"TECH", // 技術的に興味深い
	"RISK", // 影響範囲が大きい
	"UX", // ユーザ体験に影響
	"PERF", // 性能面の影響
	"SECURITY", // セキュリティ観点
]);

const mainChangeSchema = z.object({
	fileName: z.string(),
	changeTypes: z
		.array(changeTypeEnum)
		.min(1, "変更種別は1つ以上選択してください"),
	description: z.string(),
});

const notablePointSchema = z.object({
	categories: z.array(categoryEnum).min(1, "カテゴリは1つ以上選択してください"),
	point: z.string(),
});

export const pullRequestArticleSchema = pullRequestSchema.extend({
	id: z.string().uuid("記事 ID は UUID 形式で入力してください"),
	aiGeneratedTitle: z
		.string()
		.min(1, "AI 生成タイトルは必須です")
		.max(80, "AI 生成タイトルは 80 文字以内で入力してください"),
	backgroundAndPurpose: z.string().optional(),
	mainChanges: z.array(mainChangeSchema).optional(),
	notablePoints: z.array(notablePointSchema).optional(),
	summaryGeneratedAt: z.string().datetime("正しい日時形式で入力してください"),
	createdAt: z.string().datetime("正しい日時形式で入力してください").optional(),
	updatedAt: z.string().datetime("正しい日時形式で入力してください").optional(),
});
export type PullRequestArticle = z.infer<typeof pullRequestArticleSchema>;
