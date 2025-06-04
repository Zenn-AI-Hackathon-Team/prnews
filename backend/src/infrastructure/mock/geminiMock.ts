import type { GeminiPort } from "../../ports/geminiPort.js";

export const geminiMock = (): GeminiPort => ({
	async summarizeDiff(diff: string) {
		return {
			aiGeneratedTitle: "AI生成タイトル",
			backgroundAndPurpose: "背景と目的",
			mainChanges: "主な変更点",
			notablePoints: "注目点",
			summaryGeneratedAt: new Date().toISOString(),
		};
	},
});
