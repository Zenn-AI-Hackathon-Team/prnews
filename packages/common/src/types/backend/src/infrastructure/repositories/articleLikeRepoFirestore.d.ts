import type { Firestore } from "firebase-admin/firestore";
import type { ArticleLikeRepoPort } from "../../ports/articleLikeRepoPort";
export declare const articleLikeRepoFirestore: (db: Firestore) => ArticleLikeRepoPort;
