import type { AuthSession } from "@prnews/common";

export interface AuthSessionRepoPort {
	save: (session: AuthSession) => Promise<AuthSession | null>;
	findByFirebaseUidActiveSession: (
		firebaseUid: string,
	) => Promise<AuthSession | null>;
	update: (session: AuthSession) => Promise<AuthSession | null>;
}
