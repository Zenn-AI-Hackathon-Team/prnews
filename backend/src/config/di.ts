import { geminiMock } from "../infrastructure/mock/geminiMock";
import { githubMock } from "../infrastructure/mock/githubMock";
import { prRepoMemory } from "../infrastructure/mock/prRepoMemory";

export const buildDependencies = () => ({
	github: githubMock(),
	gemini: geminiMock(),
	prRepo: prRepoMemory(),
});
