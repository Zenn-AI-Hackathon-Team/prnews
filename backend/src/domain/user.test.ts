import { createUser } from "./user";

beforeAll(() => {
	if (!globalThis.crypto) {
		globalThis.crypto = require("node:crypto").webcrypto;
	}
});

describe("createUser", () => {
	it("idがpropsで渡され、propsが正しく反映される", () => {
		const props = {
			id: "test-id-123",
			githubUserId: 12345,
			githubUsername: "testuser",
			language: "ja",
			firebaseUid: "firebase-uid",
			githubDisplayName: "Test User",
			email: "test@example.com",
			avatarUrl: "http://example.com/avatar.png",
			createdAt: "2024-01-01",
			updatedAt: "2024-01-02",
			encryptedGitHubAccessToken: "encrypted-token",
		};
		const user = createUser(props);
		expect(user).toMatchObject(props);
		expect(user.id).toBe("test-id-123");
	});
});
