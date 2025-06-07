import {
	type ServiceAccount,
	cert,
	getApps,
	initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../../.gcloud/firebase-admin.json" assert {
	type: "json",
};
import { createGeneralService } from "../application/generalService";
import { createPrService } from "../application/prService";
import { createRankingService } from "../application/rankingService";
import { createUserService } from "../application/userService";
import { geminiClient } from "../infrastructure/adapters/geminiClient";
import { githubClient } from "../infrastructure/adapters/githubClient";
import { articleLikeRepoFirestore } from "../infrastructure/repositories/articleLikeRepoFirestore";
import { authSessionRepoFirestore } from "../infrastructure/repositories/authSessionRepoFirestore";
import { favoriteRepositoryRepoFirestore } from "../infrastructure/repositories/favoriteRepositoryRepoFirestore";
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
	};
};

export type Dependencies = ReturnType<typeof buildDependencies>;
