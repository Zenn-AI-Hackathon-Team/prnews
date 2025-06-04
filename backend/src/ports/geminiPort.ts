export interface GeminiPort {
	summarizeDiff(diff: string): Promise<{
		aiGeneratedTitle: string;
		backgroundAndPurpose?: string;
		mainChanges?: {
			fileName: string;
			changeTypes: (
				| "FEAT"
				| "FIX"
				| "REFACTOR"
				| "DOCS"
				| "TEST"
				| "PERF"
				| "BUILD"
				| "CHORE"
			)[];
			description: string;
		}[];
		notablePoints?: {
			categories: ("TECH" | "RISK" | "UX" | "PERF" | "SECURITY")[];
			point: string;
		}[];
		summaryGeneratedAt: string;
		likeCount: number;
	}>;
}
