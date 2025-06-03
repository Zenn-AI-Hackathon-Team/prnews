export interface GeminiPort {
	summarizeDiff(diff: string): Promise<{
		aiGeneratedTitle: string;
		backgroundAndPurpose?: string;
		mainChanges?: string;
		notablePoints?: string;
		summaryGeneratedAt: string;
	}>;
}
