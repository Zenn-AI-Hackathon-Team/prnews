import {
	type ServiceAccount,
	cert,
	getApps,
	initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createIssueService } from "src/application/issueService";

const serviceAccount = JSON.parse(
	process.env.FIREBASE_ADMIN_SDK_CONFIG || "{}",
) as ServiceAccount;
import { createGeneralService } from "../application/generalService";
import { createPrService } from "../application/prService";
import { createRankingService } from "../application/rankingService";
import { createUserService } from "../application/userService";
import { geminiClient } from "../infrastructure/adapters/geminiClient";
import { githubClient } from "../infrastructure/adapters/githubClient";
import { articleLikeRepoFirestore } from "../infrastructure/repositories/articleLikeRepoFirestore";
import { authSessionRepoFirestore } from "../infrastructure/repositories/authSessionRepoFirestore";
import { favoriteRepositoryRepoFirestore } from "../infrastructure/repositories/favoriteRepositoryRepoFirestore";
import { issueRepoFirestore } from "../infrastructure/repositories/issueRepoFirestore";
import { prRepoFirestore } from "../infrastructure/repositories/prRepoFirestore";
import { userRepoFirestore } from "../infrastructure/repositories/userRepoFirestore";

// [注意] このグローバルインスタンスは開発・検証用の仮実装です。
// 本番運用時は必ず外部DB（Firestore等）に置き換えてください。

// Firestoreインスタンスの初期化（すでに初期化済みならスキップ）
if (getApps().length === 0) {
	initializeApp({
		credential: cert(serviceAccount as ServiceAccount),
	});
}
const firestore = getFirestore();

const userRepo = userRepoFirestore(firestore);
const authSessionRepo = authSessionRepoFirestore(firestore);
const favoriteRepositoryRepo = favoriteRepositoryRepoFirestore(firestore);
const articleLikeRepo = articleLikeRepoFirestore(firestore);
const prRepo = prRepoFirestore(firestore);
const github = githubClient();
const gemini = geminiClient();
const auth = getAuth();
const issueRepo = issueRepoFirestore(firestore);

export const buildDependencies = () => {
	const generalService = createGeneralService({});
	const prService = createPrService({
		github,
		gemini,
		prRepo,
		articleLikeRepo,
		userRepo,
	});
	const userService = createUserService({
		userRepo,
		authSessionRepo,
		favoriteRepositoryRepo,
		githubPort: github,
	});
	const issueService = createIssueService({
		github,
		gemini,
		issueRepo,
		userRepo,
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
		auth,
		issueRepo,
		issueService,
	};
};

export type Dependencies = ReturnType<typeof buildDependencies>;
