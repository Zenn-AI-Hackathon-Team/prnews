import { createAuthSession } from "./authSession";
import type { AuthSession } from "./authSession";

describe("createAuthSession", () => {
	it("propsで渡した値が正しくAuthSessionオブジェクトに反映される", () => {
		const props: AuthSession = {
			id: "session-id-001",
			userId: "user-id-001",
			firebaseUid: "firebase-uid-001",
			tokenHash:
				"a_very_long_and_secure_hash_string_64_chars_long_xxxxxxxxxxxx",
			expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
			createdAt: new Date().toISOString(),
			revokedAt: undefined, // またはnullでもOK
		};

		const authSession = createAuthSession(props);

		expect(authSession).toEqual(props);
	});
});
