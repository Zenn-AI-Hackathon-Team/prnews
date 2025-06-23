import type { DecodedIdToken } from "firebase-admin/auth";
import { type Context, Hono, type Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { PrService } from "../../application/prService";
import type { UserService } from "../../application/userService";
import type { User } from "../../domain/user";
import { createApp } from "../hono-app";
import type { AuthenticatedUser } from "../middlewares/authMiddleware";
import userRoutes from "./userRoutes";

type TestVariables = {
	userService: jest.Mocked<UserService>;
	prService: jest.Mocked<PrService>;
	user: AuthenticatedUser;
};

jest.mock("../middlewares/authMiddleware", () => ({
	authMiddleware: jest.fn((c: Context, next: Next) => {
		// テストでは既にc.var.userがセットされてるので、ここでは単純に次の処理へ進める
		return next();
	}),
}));

jest.mock("firebase-admin/auth", () => ({
	getAuth: () => ({
		verifyIdToken: jest
			.fn()
			.mockImplementation(async (token: string): Promise<DecodedIdToken> => {
				if (token === "dummy-token") {
					return { uid: "test-firebase-uid" } as DecodedIdToken;
				}
				throw new HTTPException(401, { message: "Invalid test token" });
			}),
	}),
}));

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
			getFavoriteRepositories: jest.fn(),
			deleteFavoriteRepository: jest.fn(),
		} as unknown as jest.Mocked<UserService>;
		mockPrService = {
			getLikedArticles: jest.fn(),
		} as unknown as jest.Mocked<PrService>;

		app = createApp<TestVariables>();

		app.onError((err: unknown, c: Context<{ Variables: TestVariables }>) => {
			if (err instanceof HTTPException) {
				if (err.cause instanceof ZodError) {
					return c.json(
						{
							code: "VALIDATION_ERROR",
							message: err.message,
							details: err.cause.errors,
						},
						err.status,
					);
				}
				return c.json(
					{ code: "HTTP_EXCEPTION", message: err.message },
					err.status,
				);
			}
			return c.json(
				{ code: "INTERNAL_SERVER_ERROR", message: "Internal Server Error" },
				500,
			);
		});

		app.use(
			"*",
			async (c: Context<{ Variables: TestVariables }>, next: Next) => {
				c.set("userService", mockUserService);
				c.set("prService", mockPrService);
				c.set("user", testUser);
				await next();
			},
		);
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
		const unauthApp = new Hono();
		unauthApp.route("/", userRoutes);
		const req = new Request("http://localhost/users/me");
		const res = await unauthApp.request(req);
		expect(res.status).toBe(401);
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
		expect(json.code).toBe("VALIDATION_ERROR");
		expect(json.message).toBe("Validation Failed");
	});

	it("POST /auth/signup 正常系", async () => {
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
		mockUserService.createUser.mockResolvedValue(user);
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
		const unauthApp = new Hono();
		unauthApp.route("/", userRoutes);
		const req = new Request("http://localhost/auth/signup", {
			method: "POST",
			body: JSON.stringify({ language: "ja" }),
			headers: { "content-type": "application/json" },
		});
		const res = await unauthApp.request(req);
		expect(res.status).toBe(401);
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
		expect(Array.isArray(json.data.data)).toBe(true);
	});

	describe("GET /users/me/favorite-repositories", () => {
		const mockFavoriteRepo = {
			id: "fav-uuid-1",
			userId: "user-uuid-1",
			githubRepoId: 12345,
			owner: "owner",
			repo: "repo-1",
			registeredAt: new Date().toISOString(),
		};

		it("正常系: 認証済みユーザーに正しいリストとページネーションを返す", async () => {
			mockUserService.getFavoriteRepositories.mockResolvedValue({
				favorites: [mockFavoriteRepo],
				total: 1,
			});
			const req = new Request(
				"http://localhost/users/me/favorite-repositories",
			);
			const res = await app.request(req);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(Array.isArray(json.data.data)).toBe(true);
			expect(json.data.data[0].id).toBe("fav-uuid-1");
			expect(json.data.pagination.totalItems).toBe(1);
		});

		it("正常系: limit/offsetクエリが正しく渡る", async () => {
			const spy = mockUserService.getFavoriteRepositories.mockResolvedValue({
				favorites: [],
				total: 0,
			});
			const req = new Request(
				"http://localhost/users/me/favorite-repositories?limit=5&offset=10",
			);
			await app.request(req);
			expect(spy).toHaveBeenCalledWith(testUser.id, { limit: 5, offset: 10 });
		});

		it("異常系: 未認証の場合は401", async () => {
			const unauthApp = new Hono();
			unauthApp.route("/", userRoutes);
			const req = new Request(
				"http://localhost/users/me/favorite-repositories",
			);
			const res = await unauthApp.request(req);
			expect(res.status).toBe(401);
		});
	});

	describe("DELETE /users/me/favorite-repositories/:favoriteId", () => {
		const validId = "fav-uuid-1";

		it("正常系: 認証済みユーザーが自分のfavoriteIdを削除できる", async () => {
			mockUserService.deleteFavoriteRepository.mockResolvedValue({
				success: true,
			});

			const req = new Request(
				`http://localhost/users/me/favorite-repositories/${validId}`,
				{ method: "DELETE" },
			);
			const res = await app.request(req);
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data.message).toMatch(/deleted successfully/);
			expect(mockUserService.deleteFavoriteRepository).toHaveBeenCalledWith(
				testUser.id,
				validId,
			);
		});

		it("異常系: サービスがHTTPException(404)をスローした場合、404を返す", async () => {
			mockUserService.deleteFavoriteRepository.mockRejectedValue(
				new HTTPException(404, { message: "Not found" }),
			);

			const req = new Request(
				`http://localhost/users/me/favorite-repositories/${validId}`,
				{ method: "DELETE" },
			);
			const res = await app.request(req);

			expect(res.status).toBe(404);
			const json = await res.json();
			expect(json.code).toBe("HTTP_EXCEPTION");
			expect(json.message).toBe("Not found");
		});
	});

	describe("POST /users/me/favorite-repositories", () => {
		const owner = "unknown-owner";
		const repo = "unknown-repo";

		it("異常系: サービスがHTTPException(404)をスローした場合、404を返す", async () => {
			mockUserService.registerFavoriteRepository.mockRejectedValue(
				new HTTPException(404, { message: "GitHub repository not found" }),
			);

			const req = new Request(
				"http://localhost/users/me/favorite-repositories",
				{
					method: "POST",
					body: JSON.stringify({ owner, repo }),
					headers: { "Content-Type": "application/json" },
				},
			);
			const res = await app.request(req);

			expect(res.status).toBe(404);
			const json = await res.json();
			expect(json.code).toBe("HTTP_EXCEPTION");
			expect(json.message).toBe("GitHub repository not found");
		});
	});

	describe("POST /auth/signup", () => {
		it("正常系: ユーザー作成で201", async () => {
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
			mockUserService.createUser.mockResolvedValue(user);
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
		it("異常系: 既存ユーザーなら409", async () => {
			mockUserService.createUser.mockResolvedValue("already_exists");
			const req = new Request("http://localhost/auth/signup", {
				method: "POST",
				body: JSON.stringify({ language: "ja" }),
				headers: { "content-type": "application/json" },
			});
			const res = await app.request(req);
			expect(res.status).toBe(409);
			const json = await res.json();
			expect(json.code).toBe("HTTP_EXCEPTION");
			expect(json.message).toMatch(/already exists/);
		});
		it("異常系: createUserがnullなら500", async () => {
			mockUserService.createUser.mockResolvedValue(null);
			const req = new Request("http://localhost/auth/signup", {
				method: "POST",
				body: JSON.stringify({ language: "ja" }),
				headers: { "content-type": "application/json" },
			});
			const res = await app.request(req);
			expect(res.status).toBe(500);
			const json = await res.json();
			expect(json.code).toBe("HTTP_EXCEPTION");
			expect(json.message).toMatch(/create/);
		});
		it("異常系: 未認証なら401", async () => {
			const unauthApp = new Hono();
			unauthApp.route("/", userRoutes);
			const req = new Request("http://localhost/auth/signup", {
				method: "POST",
				body: JSON.stringify({ language: "ja" }),
				headers: { "content-type": "application/json" },
			});
			const res = await unauthApp.request(req);
			expect(res.status).toBe(401);
		});
	});

	describe("POST /auth/token/exchange", () => {
		it("正常系: saveGitHubTokenがsuccessなら200", async () => {
			mockUserService.saveGitHubToken.mockResolvedValue({ success: true });
			const req = new Request("http://localhost/auth/token/exchange", {
				method: "POST",
				body: JSON.stringify({ githubAccessToken: "ghp_abc" }),
				headers: {
					"content-type": "application/json",
					authorization: "Bearer dummy-token",
				},
			});
			const res = await app.request(req);
			expect(res.status).toBe(200);
			const json = await res.json();
			expect(json.success).toBe(true);
			expect(json.data.message).toMatch(/Token saved/);
		});
		it("異常系: Authorizationヘッダーが無い場合は401", async () => {
			const req = new Request("http://localhost/auth/token/exchange", {
				method: "POST",
				body: JSON.stringify({ githubAccessToken: "ghp_abc" }),
				headers: { "content-type": "application/json" },
			});
			const res = await app.request(req);
			expect(res.status).toBe(401);
		});
		it("異常系: githubAccessTokenが無い場合は422", async () => {
			const req = new Request("http://localhost/auth/token/exchange", {
				method: "POST",
				body: JSON.stringify({}),
				headers: {
					"content-type": "application/json",
					authorization: "Bearer dummy-token",
				},
			});
			const res = await app.request(req);
			expect(res.status).toBe(422);
		});
		it("異常系: saveGitHubTokenがsuccess=falseなら500", async () => {
			mockUserService.saveGitHubToken.mockResolvedValue({ success: false });
			const req = new Request("http://localhost/auth/token/exchange", {
				method: "POST",
				body: JSON.stringify({ githubAccessToken: "ghp_abc" }),
				headers: {
					"content-type": "application/json",
					authorization: "Bearer dummy-token",
				},
			});
			const res = await app.request(req);
			expect(res.status).toBe(500);
		});
	});
});
