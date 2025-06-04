import { createGeneralService } from "../application/generalService";
import { createPrService } from "../application/prService";
import { geminiMock } from "../infrastructure/mock/geminiMock";
import { githubMock } from "../infrastructure/mock/githubMock";
import { prRepoMemory } from "../infrastructure/mock/prRepoMemory";

export const buildDependencies = () => ({
	github: githubMock(),
	gemini: geminiMock(),
	prRepo: prRepoMemory(),
	generalService: createGeneralService({}),
	prService: createPrService({
		github: githubMock(),
		gemini: geminiMock(),
		prRepo: prRepoMemory(),
	}),
});

export type Dependencies = ReturnType<typeof buildDependencies>;
