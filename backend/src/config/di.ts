import {
	type ServiceAccount,
	cert,
	getApps,
	initializeApp,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { createIssueService } from "src/application/issueService";
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

let firestore: Firestore;
let auth: Auth;

export async function initializeFirebase() {
	if (getApps().length > 0) {
		firestore = getFirestore();
		auth = getAuth();
		return;
	}

	if (process.env.NODE_ENV === "production") {
		initializeApp();
	} else {
		try {
			const keyPath = ["..", "..", ".gcloud", "firebase-admin.json"].join("/");
			const serviceAccountModule = await import(keyPath, {
				assert: { type: "json" },
			});
			const serviceAccount = serviceAccountModule.default;
			initializeApp({
				credential: cert(serviceAccount as ServiceAccount),
			});
		} catch (err) {
			console.error(
				"Failed to load local firebase-admin.json, falling back to default credentials.",
				err,
			);
			initializeApp(); // Fallback for CI/other envs without the key
		}
	}
	firestore = getFirestore();
	auth = getAuth();
}

export const buildDependencies = () => {
	if (!firestore || !auth) {
		throw new Error(
			"Firebase has not been initialized. Call initializeFirebase() first.",
		);
	}

	const userRepo = userRepoFirestore(firestore);
	const authSessionRepo = authSessionRepoFirestore(firestore);
	const favoriteRepositoryRepo = favoriteRepositoryRepoFirestore(firestore);
	const articleLikeRepo = articleLikeRepoFirestore(firestore);
	const prRepo = prRepoFirestore(firestore);
	const github = githubClient();
	const gemini = geminiClient();
	const issueRepo = issueRepoFirestore(firestore);

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
		userRepo,
		authSessionRepo,
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