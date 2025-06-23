import { z } from "zod";

// Issueに付与されるラベルのスキーマ
const labelSchema = z.object({
	name: z.string().describe("ラベル名 (例: 'bug', 'enhancement')"),
	color: z.string().length(6).describe("ラベルの色 (6桁の16進数)"),
	description: z.string().nullable().describe("ラベルの説明"),
});

// Issueの作成者や担当者のスキーマ
const githubUserSchema = z.object({
	login: z.string(),
	avatar_url: z.string().url(),
	html_url: z.string().url(),
});

// Issueの本体スキーマ
export const issueSchema = z.object({
	// --- 必須情報 ---
	issueNumber: z
		.number()
		.int()
		.positive()
		.describe("リポジトリ内でのIssue番号"),
	owner: z.string().describe("リポジトリのオーナー名"),
	repo: z.string().describe("リポジトリ名"),
	githubIssueUrl: z.string().url().describe("GitHub上のIssueへのURL"),
	title: z.string().describe("Issueのタイトル"),
	author: githubUserSchema.describe("Issueの作成者"),
	state: z.enum(["open", "closed"]).describe("Issueの状態"),
	labels: z.array(labelSchema).describe("Issueに付与されたラベル一覧"),
	comments: z
		.array(
			z.object({
				author: githubUserSchema.nullable(),
				body: z.string(),
				createdAt: z.string().datetime(),
			}),
		)
		.describe("Issueに紐づくコメント一覧"),
	githubIssueCreatedAt: z
		.string()
		.datetime()
		.describe("GitHub上でのIssue作成日時"),
	githubIssueUpdatedAt: z
		.string()
		.datetime()
		.describe("GitHub上でのIssue最終更新日時"),

	// --- オプショナル/Nullable情報 ---
	body: z.string().nullable().describe("Issueの本文 (Markdown)"),
	assignee: githubUserSchema.nullable().describe("担当者"),
	assignees: z.array(githubUserSchema).nullable().describe("担当者リスト"),
	milestone: z
		.object({
			title: z.string(),
			state: z.enum(["open", "closed"]),
		})
		.nullable()
		.describe("関連付けられたマイルストーン"),
});

export type Issue = z.infer<typeof issueSchema>;
