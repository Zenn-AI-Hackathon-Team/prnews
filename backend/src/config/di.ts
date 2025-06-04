import { createGeneralService } from "../application/generalService";
import { createPrService } from "../application/prService";
import { createUserService } from "../application/userService";
import { authSessionRepoMemory } from "../infrastructure/mock/authSessionRepoMemory";
import { geminiMock } from "../infrastructure/mock/geminiMock";
import { githubMock } from "../infrastructure/mock/githubMock";
import { prRepoMemory } from "../infrastructure/mock/prRepoMemory";
import { userRepoMemory } from "../infrastructure/mock/userRepoMemory";
import type { AuthSessionRepoPort } from "../ports/authSessionRepoPort";
import type { UserRepoPort } from "../ports/userRepoPort";

// [注意] このグローバルインスタンスは開発・検証用の仮実装です。
// 本番運用時は必ず外部DB（Firestore等）に置き換えてください。
const userRepo = userRepoMemory();
const authSessionRepo = authSessionRepoMemory();

export const buildDependencies = () => {
	const github = githubMock();
	const gemini = geminiMock();
	const prRepo = prRepoMemory();
	const generalService = createGeneralService({});
	const prService = createPrService({ github, gemini, prRepo });
	const userService = createUserService({ userRepo, authSessionRepo });
	return {
		github,
		gemini,
		prRepo,
		userRepo, // グローバルなメモリDB（仮）
		authSessionRepo, // グローバルなメモリDB（仮）
		generalService,
		prService,
		userService,
	};
};

export type Dependencies = ReturnType<typeof buildDependencies>;
