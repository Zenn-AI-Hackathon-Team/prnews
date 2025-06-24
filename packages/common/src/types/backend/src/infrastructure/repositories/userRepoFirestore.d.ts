import type { Firestore } from "firebase-admin/firestore";
import type { UserRepoPort } from "../../ports/userRepoPort";
export declare const userRepoFirestore: (db: Firestore) => UserRepoPort;
