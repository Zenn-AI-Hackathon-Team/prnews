import { type Context, Hono, type Next } from "hono";
import type { PrService } from "../../application/prService";
import type { Dependencies } from "../../config/di";
import type { PullRequest } from "../../domain/pullRequest";
import { NotFoundError } from "../../errors/NotFoundError";
import type { PrRepoPort } from "../../ports/prRepoPort";
import type {
	AuthVariables,
	AuthenticatedUser,
} from "../middlewares/authMiddleware";
import prRoutes from "./prRoutes";

const testUser: AuthenticatedUser = {
	id: "11111111-1111-1111-1111-111111111111",
	firebaseUid: "f1",
	githubUsername: "foo",
	githubDisplayName: "Foo Bar",
	email: "foo@example.com",
	avatarUrl: "http://example.com/avatar.png",
};

import * as auth from "../middlewares/authMiddleware";

jest.mock("../middlewares/authMiddleware", () => {
	const original = jest.requireActual("../middlewares/authMiddleware");
	return {
		...original,
		authMiddleware: jest.fn((c: Context, next: Next) => {
			c.set("user", testUser);
			return next();
		}),
	};
});

type TestVariables = {
	prService: jest.Mocked<PrService>;
};

const prMock: PullRequest = {
	id: "pr1",
	prNumber: 1,
	repository: "owner/repo",
	title: "PR Title",
	body: null,
	diff: "diff",
	authorLogin: "author",
	createdAt: "2024-01-01T00:00:00Z",
	comments: [
		{
			author: "reviewer1",
			body: "Looks good!",
			createdAt: "2024-01-02T00:00:00Z",
		},
	],
};

const prApiResponseMock = {
	prNumber: 1,
	repositoryFullName: "owner/repo",
	githubPrUrl: "https://github.com/owner/repo/pull/1",
	title: "PR Title",
	body: null,
	diff: "diff",
	authorLogin: "author",
	githubPrCreatedAt: "2024-01-01T00:00:00Z",
	comments: [
		{
			author: "reviewer1",
			body: "Looks good!",
			createdAt: "2024-01-02T00:00:00Z",
		},
	],
};

// authMiddlewareが期待するContextの型を定義
type AppContext = Context<{ Variables: Dependencies & AuthVariables }>;

describe("prRoutes", () => {
	let app: Hono<{
		Variables: TestVariables & {
			user?: AuthenticatedUser;
			prRepo?: jest.Mocked<PrRepoPort>;
		};
	}>;
	let mockPrService: jest.Mocked<PrService>;
	let mockPrRepo: jest.Mocked<PrRepoPort>;

	beforeEach(() => {
		mockPrService = {
			getPullRequest: jest.fn(),
			likeArticle: jest.fn(),
			ingestPr: jest.fn(),
		} as unknown as jest.Mocked<PrService>;
		mockPrRepo = {
			findByOwnerRepoNumber: jest.fn(),
		} as unknown as jest.Mocked<PrRepoPort>;
		app = new Hono<{
			Variables: TestVariables & {
				user?: AuthenticatedUser;
				prRepo?: jest.Mocked<PrRepoPort>;
			};
		}>();
		app.use("*", (c, next) => {
			c.set("prService", mockPrService);
			c.set("prRepo", mockPrRepo);
			// Contextの型をunknownを経由してアサーションし、エラーを解消
			return auth.authMiddleware(c as unknown as AppContext, next);
		});
		app.route("/", prRoutes);
	});

	it("GET /repos/:owner/:repo/pulls/:number 正常系", async () => {
		mockPrService.getPullRequest.mockResolvedValue(prApiResponseMock);
		mockPrRepo.findByOwnerRepoNumber.mockResolvedValue(prMock);
		const req = new Request("http://localhost/repos/owner/repo/pulls/1");
		const res = await app.request(req);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data).toEqual(prApiResponseMock);
	});

	it("GET /repos/:owner/:repo/pulls/:number 異常系: PRが存在しない", async () => {
		(mockPrService.getPullRequest as jest.Mock).mockResolvedValue(null);
		mockPrRepo.findByOwnerRepoNumber.mockResolvedValue(null);
		const req = new Request("http://localhost/repos/owner/repo/pulls/999");
		const res = await app.request(req);
		expect(res.status).toBe(404);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error.code).toBeDefined();
	});

	it("POST /articles/:articleId/language/:langCode/like 正常系", async () => {
		mockPrService.likeArticle.mockResolvedValue({
			alreadyLiked: false,
			likeCount: 1,
			message: "liked",
		});
		const req = new Request("http://localhost/articles/pr1/language/ja/like", {
			method: "POST",
		});
		const res = await app.request(req);
		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.likeCount).toBe(1);
	});

	it("POST /articles/:articleId/language/:langCode/like 異常系: 認証エラー", async () => {
		const authSpy = jest
			.spyOn(auth, "authMiddleware")
			.mockImplementation((c: Context, next: Next) => {
				return next();
			});

		const req = new Request("http://localhost/articles/pr1/language/ja/like", {
			method: "POST",
		});
		const res = await app.request(req);
		const json = await res.json();

		expect(res.status).toBe(401);
		expect(json.success).toBe(false);
		expect(json.error.code).toBe("UNAUTHENTICATED");

		authSpy.mockRestore();
	});

	describe("POST /repos/:owner/:repo/pulls/:number/ingest", () => {
		it("異常系: サービスがNotFoundErrorをスローした場合、404を返す", async () => {
			mockPrService.ingestPr.mockRejectedValue(
				new NotFoundError("NOT_FOUND", "Pull request not found"),
			);

			const req = new Request(
				"http://localhost/repos/owner/repo/pulls/999/ingest",
				{ method: "POST" },
			);
			const res = await app.request(req);

			expect(res.status).toBe(404);
			const json = await res.json();
			expect(json.success).toBe(false);
			expect(json.error.code).toBe("NOT_FOUND");
		});

		it("異常系: パスパラメータが不正な場合、422を返す", async () => {
			const req = new Request(
				"http://localhost/repos/owner/repo/pulls/not-a-number/ingest",
				{ method: "POST" },
			);
			const res = await app.request(req);

			expect(res.status).toBe(422);
			const json = await res.json();
			expect(json.success).toBe(false);
			expect(json.error.code).toBe("VALIDATION_ERROR");
		});
	});
});
