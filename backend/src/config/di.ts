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

export function initializeFirebase() {
	if (getApps().length > 0) {
		firestore = getFirestore();
		auth = getAuth();
		return;
	}

	const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

	if (serviceAccountJson) {
		try {
			const serviceAccount = JSON.parse(serviceAccountJson);
			initializeApp({
				credential: cert(serviceAccount as ServiceAccount),
			});
			console.log("Firebase initialized with service account from environment variable.");
		} catch (error) {
			console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Falling back to default credentials.", error);
			initializeApp();
		}
	} else {
		console.log("FIREBASE_SERVICE_ACCOUNT_JSON not found. Using default credentials.");
		initializeApp();
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
