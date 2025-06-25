import type { Firestore } from "firebase-admin/firestore";
import type { IssueRepoPort } from "../../ports/issueRepoPort";
export declare const issueRepoFirestore: (db: Firestore) => IssueRepoPort;
