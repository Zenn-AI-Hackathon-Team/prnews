import { createUser, createUserObjectFromAuthenticatedUser } from "./user";
import type { User } from "./user";

beforeAll(() => {
	if (!globalThis.crypto) {
		globalThis.crypto = require("node:crypto").webcrypto;
	}
});

describe("createUser", () => {
	it("idが自動生成され、propsが正しく反映される", () => {
		const props = {
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
		expect(typeof user.id).toBe("string");
		expect(user.id.length).toBeGreaterThan(0);
	});
});

describe("createUserObjectFromAuthenticatedUser", () => {
	it("AuthenticatedUserからUserオブジェクトの一部が生成される", () => {
		const authUser = {
			id: "dummy-id",
			firebaseUid: "uid123456",
			githubUsername: "authuser",
			githubDisplayName: "Auth User",
			email: "auth@example.com",
			avatarUrl: "http://example.com/auth.png",
		};
		const userObj = createUserObjectFromAuthenticatedUser(authUser, "en");
		expect(userObj.githubUsername).toBe("authuser");
		expect(userObj.language).toBe("en");
		expect(userObj.firebaseUid).toBe("uid123456");
		expect(userObj.githubDisplayName).toBe("Auth User");
		expect(userObj.email).toBe("auth@example.com");
		expect(userObj.avatarUrl).toBe("http://example.com/auth.png");
		expect(typeof userObj.githubUserId).toBe("number");
	});

	it("language未指定時はjaになる", () => {
		const authUser = {
			id: "dummy-id",
			firebaseUid: "uid999999",
			githubUsername: "authuser2",
			githubDisplayName: "Auth User2",
			email: "auth2@example.com",
			avatarUrl: "http://example.com/auth2.png",
		};
		const userObj = createUserObjectFromAuthenticatedUser(authUser);
		expect(userObj.language).toBe("ja");
	});
});
