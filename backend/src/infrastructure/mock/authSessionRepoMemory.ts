import { randomUUID } from "node:crypto";
import type { AuthSession } from "@prnews/common";
import type { AuthSessionRepoPort } from "../../ports/authSessionRepoPort";

export const authSessionRepoMemory = (): AuthSessionRepoPort => {
	const sessions = new Map<string, AuthSession>();

	return {
		save: async (session) => {
			if (!session.id) {
				session.id = randomUUID();
			}
			console.log(
				`[AuthSessionRepoMemory] Saving session: ${session.id} for FirebaseUID: ${session.firebaseUid}`,
			);
			sessions.set(session.id, session);
			return sessions.get(session.id) || null;
		},
		findByFirebaseUidActiveSession: async (firebaseUid) => {
			console.log(
				`[AuthSessionRepoMemory] Finding active session by FirebaseUID: ${firebaseUid}`,
			);
			for (const session of sessions.values()) {
				if (session.firebaseUid === firebaseUid && !session.revokedAt) {
					return session;
				}
			}
			return null;
		},
		update: async (session) => {
			if (!session.id || !sessions.has(session.id)) {
				console.error(
					`[AuthSessionRepoMemory] Session not found for update: ${session.id}`,
				);
				return null;
			}
			console.log(`[AuthSessionRepoMemory] Updating session: ${session.id}`);
			sessions.set(session.id, session);
			return sessions.get(session.id) || null;
		},
		findById: async (id: string) => {
			return sessions.get(id) || null;
		},
	};
};
