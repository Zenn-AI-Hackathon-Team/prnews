import { Hono } from "hono";
import type { PrService } from "../../application/prService";
import type { UserService } from "../../application/userService";
import type { User } from "../../domain/user";
import type { AuthenticatedUser } from "../middlewares/authMiddleware";
import userRoutes from "./userRoutes";

type TestVariables = {
	userService: jest.Mocked<UserService>;
	prService: jest.Mocked<PrService>;
	user: AuthenticatedUser;
};

describe("userRoutes", () => {
	let app: Hono<{ Variables: TestVariables }>;
	let mockUserService: jest.Mocked<UserService>;
	let mockPrService: jest.Mocked<PrService>;
	const testUser: AuthenticatedUser = {
		id: "11111111-1111-1111-1111-111111111111",
		firebaseUid: "f1",
		githubUsername: "foo",
		githubDisplayName: "Foo Bar",
		email: "foo@example.com",
		avatarUrl: "http://example.com/avatar.png",
	};

	beforeEach(() => {
		mockUserService = {
			getCurrentUser: jest.fn(),
			logoutUser: jest.fn(),
			createUser: jest.fn(),
			registerFavoriteRepository: jest.fn(),
			createSession: jest.fn(),
			saveGitHubToken: jest.fn(),
		} as unknown as jest.Mocked<UserService>;
		mockPrService = {
			getLikedArticles: jest.fn(),
		} as unknown as jest.Mocked<PrService>;
		app = new Hono<{ Variables: TestVariables }>();
		app.use("*", async (c, next) => {
			c.set("userService", mockUserService);
			c.set("prService", mockPrService);
			c.set("user", testUser);
			await next();
		});
		app.route("/", userRoutes);
	});

	it("GET /users/me 正常系", async () => {
		const user: User = {
			id: "11111111-1111-1111-1111-111111111111",
			githubUserId: 1,
			githubUsername: "foo",
			language: "ja",
			firebaseUid: "f1",
			githubDisplayName: "Foo Bar",
			email: "foo@example.com",
			avatarUrl: "http://example.com/avatar.png",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};
		mockUserService.getCurrentUser.mockResolvedValue(user);
		const req = new Request("http://localhost/users/me");
		const res = await app.request(req);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.id).toBe("11111111-1111-1111-1111-111111111111");
	});

	it("GET /users/me 異常系: 未認証", async () => {
		app = new Hono();
		app.use("*", async (c, next) => {
			await next();
		});
		app.route("/", userRoutes);
		const req = new Request("http://localhost/users/me");
		const res = await app.request(req);
		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error.code).toBeDefined();
	});

	it("POST /auth/logout 正常系", async () => {
		mockUserService.logoutUser.mockResolvedValue({
			success: true,
			message: "ok",
		});
		const req = new Request("http://localhost/auth/logout", { method: "POST" });
		const res = await app.request(req);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
	});

	it("POST /users/me/favorite-repositories 異常系: owner/repo未指定", async () => {
		const req = new Request("http://localhost/users/me/favorite-repositories", {
			method: "POST",
			body: JSON.stringify({}),
			headers: { "content-type": "application/json" },
		});
		const res = await app.request(req);
		expect(res.status).toBe(422);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error.code).toBeDefined();
	});

	it("POST /auth/signup 正常系", async () => {
		mockUserService.createUser.mockResolvedValue({
			id: "11111111-1111-1111-1111-111111111111",
			githubUserId: 1,
			githubUsername: "foo",
			language: "ja",
			firebaseUid: "f1",
			githubDisplayName: "Foo Bar",
			email: "foo@example.com",
			avatarUrl: "http://example.com/avatar.png",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		});
		const req = new Request("http://localhost/auth/signup", {
			method: "POST",
			body: JSON.stringify({ language: "ja" }),
			headers: { "content-type": "application/json" },
		});
		const res = await app.request(req);
		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.id).toBe("11111111-1111-1111-1111-111111111111");
	});

	it("POST /auth/signup 異常系: 未認証", async () => {
		app = new Hono();
		app.use("*", async (c, next) => {
			await next();
		});
		app.route("/", userRoutes);
		const req = new Request("http://localhost/auth/signup", {
			method: "POST",
			body: JSON.stringify({ language: "ja" }),
			headers: { "content-type": "application/json" },
		});
		const res = await app.request(req);
		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error.code).toBeDefined();
	});

	it("POST /auth/session 正常系", async () => {
		mockUserService.createSession.mockResolvedValue({
			id: "22222222-2222-2222-2222-222222222222",
			userId: "11111111-1111-1111-1111-111111111111",
			firebaseUid: "f1",
			tokenHash: "a".repeat(64),
			expiresAt: "2024-12-31T23:59:59Z",
			createdAt: "2024-01-01T00:00:00Z",
			revokedAt: null,
		});
		const req = new Request("http://localhost/auth/session", {
			method: "POST",
		});
		const res = await app.request(req);
		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.id).toBe("22222222-2222-2222-2222-222222222222");
	});

	it("GET /users/me/liked-articles 正常系", async () => {
		mockPrService.getLikedArticles.mockResolvedValue({
			data: [],
			totalItems: 0,
		});
		const req = new Request("http://localhost/users/me/liked-articles");
		const res = await app.request(req);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(Array.isArray(json.data)).toBe(true);
	});
});
