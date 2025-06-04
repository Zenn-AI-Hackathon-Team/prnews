import type { GeminiPort } from "../ports/geminiPort.js";
import type { GithubPort } from "../ports/githubPort.js";
import type { PrRepoPort } from "../ports/prRepoPort.js";

export const createPrService = (deps: {
	github: GithubPort;
	gemini: GeminiPort;
	prRepo: PrRepoPort;
}) => {
	const ingestPr = async (owner: string, repo: string, number: number) => {
		// 実装は後で
	};
	const generateArticle = async (
		owner: string,
		repo: string,
		number: number,
	) => {
		// 実装は後で
	};
	return { ingestPr, generateArticle };
};
