import type { Firestore } from "firebase-admin/firestore";
import type { PrRepoPort } from "../../ports/prRepoPort";
export declare const prRepoFirestore: (db: Firestore) => PrRepoPort;
