import type { Firestore } from "firebase-admin/firestore";
import type { AuthSessionRepoPort } from "../../ports/authSessionRepoPort";
export declare const authSessionRepoFirestore: (db: Firestore) => AuthSessionRepoPort;
