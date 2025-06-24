import type { Issue } from "@prnews/common";
import type { GeminiPort } from "../../ports/geminiPort.js";

export const geminiMock = (): GeminiPort => ({
	async summarizeIssue(issue: Issue) {
		return {
			aiGeneratedTitle: "AI生成タイトル(issue)",
			problemSummary: "このIssueで解決したい課題の要約",
			solutionSuggestion: "考えられる解決策の要約",
			discussionPoints: [
				{
					author: issue.author.login,
					summary: "コメントの要約",
				},
			],
			summaryGeneratedAt: new Date().toISOString(),
			likeCount: 0,
		};
	},
	async summarizeDiff(diff: string) {
		return {
			aiGeneratedTitle: "AI生成タイトル",
			backgroundAndPurpose: "背景と目的",
			mainChanges: [
				{
					fileName: "src/index.ts",
					changeTypes: ["FEAT"],
					description: "新機能を追加",
				},
			],
			notablePoints: [
				{
					categories: ["TECH"],
					point: "技術的に面白いポイント",
				},
			],
			summaryGeneratedAt: new Date().toISOString(),
			likeCount: 0,
		};
	},
});
