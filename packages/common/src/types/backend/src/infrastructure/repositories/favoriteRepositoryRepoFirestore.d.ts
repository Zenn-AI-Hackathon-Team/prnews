import type { Firestore } from "firebase-admin/firestore";
import type { FavoriteRepositoryRepoPort } from "../../ports/favoriteRepositoryRepoPort";
export declare const favoriteRepositoryRepoFirestore: (db: Firestore) => FavoriteRepositoryRepoPort;
