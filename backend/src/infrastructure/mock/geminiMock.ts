import type { GeminiPort } from "../../ports/geminiPort.js";

export const geminiMock = (): GeminiPort => ({
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
