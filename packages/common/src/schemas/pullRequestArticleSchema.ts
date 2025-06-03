// packages/common/src/schemas/pullRequestArticleSchema.ts
import { z } from "zod";

// 主な変更点の一つを表すスキーマ
const mainChangeSchema = z.object({
	fileName: z.string().describe("変更されたファイル名"),
	changeType: z.string().describe("変更の種類（例: 機能追加、バグ修正）"), // TODO: 具体的な分類が決まったらenum化も検討
	description: z.string().describe("具体的な変更内容の短い説明"),
});

// 注目ポイントの一つを表すスキーマ
const notablePointSchema = z.object({
	category: z
		.string()
		.describe("指摘の観点（例: 技術的に面白い、影響範囲が広い）"), // TODO: 具体的な分類が決まったらenum化も検討 (チームで検討)
	point: z.string().describe("具体的な指摘内容"),
});

export const pullRequestArticleSchema = z.object({
	id: z
		.string()
		.uuid()
		.describe("このPR記事の一意なID (DBに保存する際の主キー)"),
	// AIが生成する部分
	aiGeneratedTitle: z
		.string()
		.min(1, "AI生成タイトルは必須です")
		.describe("AIが生成した、PR内容を表す1～2行程度のタイトル"),
	backgroundAndPurpose: z
		.string()
		.optional()
		.describe("PRの背景・目的（ConversationからAIが要約・抜粋）"), // TODO: AIによる生成の安定性や必須度合いを要検証
	mainChanges: z
		.array(mainChangeSchema)
		.optional()
		.describe("主な変更点のリスト"), // TODO: AIによる生成の安定性や必須度合いを要検証
	notablePoints: z
		.array(notablePointSchema)
		.optional()
		.describe("注目ポイント・重要な変更点のリスト"), // TODO: AIによる生成の安定性や必須度合いを要検証

	// PR自体に関する情報
	githubPrUrl: z
		.string()
		.url("正しいURL形式で入力してください")
		.describe("元のGitHub PRのURL"),
	githubPrId: z
		.string()
		.optional()
		.describe("GitHub上のPRのID (APIから取得できるなら)"), // TODO: GitHub APIで取得可能か、どのIDが良いか確認
	repositoryFullName: z
		.string()
		.describe("リポジトリのフルネーム (例: owner/repo)"),
	prAuthorGithubUsername: z
		.string()
		.optional()
		.describe("PR作成者のGitHubユーザー名"), // TODO: GitHub APIのレスポンスに合わせて確認
	githubPrCreatedAt: z
		.string()
		.datetime({ message: "正しい日時形式で入力してください" })
		.optional()
		.describe("GitHubでのPR作成日時"), // TODO: GitHub APIのレスポンスに合わせて確認

	// アプリ内での管理情報
	summaryGeneratedAt: z
		.string()
		.datetime({ message: "正しい日時形式で入力してください" })
		.describe("AIによる要約が生成された日時"),
	createdAt: z
		.string()
		.datetime({ message: "正しい日時形式で入力してください" })
		.optional()
		.describe("この解説記事レコードのDB作成日時"),
	updatedAt: z
		.string()
		.datetime({ message: "正しい日時形式で入力してください" })
		.optional()
		.describe("この解説記事レコードのDB最終更新日時"),
});

export type PullRequestArticle = z.infer<typeof pullRequestArticleSchema>;
