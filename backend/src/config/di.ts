import { createGeneralService } from "../application/generalService";
import { createPrService } from "../application/prService";
import { createRankingService } from "../application/rankingService";
import { createUserService } from "../application/userService";
import { articleLikeRepoMemory } from "../infrastructure/mock/articleLikeRepoMemory";
import { authSessionRepoMemory } from "../infrastructure/mock/authSessionRepoMemory";
import { favoriteRepositoryRepoMemory } from "../infrastructure/mock/favoriteRepositoryRepoMemory";
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
const favoriteRepositoryRepo = favoriteRepositoryRepoMemory();
const articleLikeRepo = articleLikeRepoMemory();
const prRepo = prRepoMemory();
const github = githubMock();
const gemini = geminiMock();

export const buildDependencies = () => {
	const generalService = createGeneralService({});
	const prService = createPrService({
		github,
		gemini,
		prRepo,
		articleLikeRepo,
	});
	const userService = createUserService({
		userRepo,
		authSessionRepo,
		favoriteRepositoryRepo,
		githubPort: github,
	});
	const rankingService = createRankingService({ prRepo, articleLikeRepo });
	return {
		github,
		gemini,
		prRepo,
		userRepo, // グローバルなメモリDB（仮）
		authSessionRepo, // グローバルなメモリDB（仮）
		favoriteRepositoryRepo,
		articleLikeRepo,
		generalService,
		prService,
		userService,
		rankingService,
	};
};

export type Dependencies = ReturnType<typeof buildDependencies>;
