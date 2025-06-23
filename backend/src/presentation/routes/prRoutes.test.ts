import type { Context, Hono, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { PrService } from "../../application/prService";
import type { Dependencies } from "../../config/di";
import type { PullRequest } from "../../domain/pullRequest";
import type { PrRepoPort } from "../../ports/prRepoPort";
import { createApp } from "../hono-app";
import type {
	AuthVariables,
	AuthenticatedUser,
} from "../middlewares/authMiddleware";
import prPrivateRoutes from "./prPrivateRoutes";

const testUser: AuthenticatedUser = {
	id: "11111111-1111-1111-1111-111111111111",
	firebaseUid: "f1",
	githubUsername: "foo",
	githubDisplayName: "Foo Bar",
	email: "foo@example.com",
	avatarUrl: "http://example.com/avatar.png",
};

jest.mock("../middlewares/authMiddleware", () => ({
	authMiddleware: jest.fn((c: Context, next: Next) => {
		if (c.var.user === undefined) {
			throw new HTTPException(401, { message: "Unauthenticated" });
		}
		return next();
	}),
}));

type TestVariables = {
	prService: jest.Mocked<PrService>;
	prRepo: jest.Mocked<PrRepoPort>;
	user: AuthenticatedUser;
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
	comments: [],
	owner: "owner",
	repo: "repo",
};

const prApiResponseMock = {
	prNumber: 1,
	owner: "owner",
	repo: "repo",
	githubPrUrl: "https://github.com/owner/repo/pull/1",
	title: "PR Title",
	body: null,
	diff: "diff",
	authorLogin: "author",
	githubPrCreatedAt: "2024-01-01T00:00:00Z",
	comments: [],
};

type AppContext = Context<{ Variables: Dependencies & AuthVariables }>;

describe("prPrivateRoutes", () => {
	let app: Hono<{ Variables: TestVariables }>;
	let mockPrService: jest.Mocked<PrService>;
	let mockPrRepo: jest.Mocked<PrRepoPort>;

	beforeEach(() => {
		mockPrService = {
			getPullRequest: jest.fn(),
			likeArticle: jest.fn(),
			ingestPr: jest.fn(),
			generateArticle: jest.fn(),
		} as unknown as jest.Mocked<PrService>;
		mockPrRepo = {
			findByOwnerRepoNumber: jest.fn(),
		} as unknown as jest.Mocked<PrRepoPort>;

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

		app.use("*", (c: Context<{ Variables: TestVariables }>, next: Next) => {
			c.set("prService", mockPrService);
			c.set("prRepo", mockPrRepo);
			c.set("user", testUser);
			return next();
		});

		app.route("/", prPrivateRoutes);
	});

	it("GET /repos/:owner/:repo/pulls/:number 正常系", async () => {
		mockPrService.getPullRequest.mockResolvedValue(prApiResponseMock);
		const req = new Request("http://localhost/repos/owner/repo/pulls/1");
		const res = await app.request(req);
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json.success).toBe(true);
		expect(json.data).toEqual(prApiResponseMock);
	});

	it("GET /repos/:owner/:repo/pulls/:number 異常系: PRが存在しない", async () => {
		mockPrService.getPullRequest.mockRejectedValue(
			new HTTPException(404, { message: "PR not found" }),
		);
		const req = new Request("http://localhost/repos/owner/repo/pulls/999");
		const res = await app.request(req);
		const json = await res.json();
		expect(res.status).toBe(404);
		expect(json.code).toBe("HTTP_EXCEPTION");
		expect(json.message).toBe("PR not found");
	});

	it("POST /articles/:articleId/language/:langCode/like 正常系", async () => {
		mockPrService.likeArticle.mockResolvedValue({
			alreadyLiked: false,
			likeCount: 1,
			message: "liked",
		});
		const req = new Request(
			`http://localhost/articles/${prMock.id}/language/ja/like`,
			{
				method: "POST",
			},
		);
		const res = await app.request(req);
		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.likeCount).toBe(1);
	});

	it("POST /articles/:articleId/language/:langCode/like 異常系: 認証エラー", async () => {
		const unauthApp = createApp();
		unauthApp.route("/", prPrivateRoutes);
		unauthApp.onError((err, c) => {
			if (err instanceof HTTPException) {
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

		const req = new Request(
			`http://localhost/articles/${prMock.id}/language/ja/like`,
			{
				method: "POST",
			},
		);
		const res = await unauthApp.request(req);
		const json = await res.json();

		expect(res.status).toBe(401);
		expect(json.code).toBe("HTTP_EXCEPTION");
		expect(json.message).toBe("Unauthenticated");
	});

	describe("POST /repos/:owner/:repo/pulls/:number/ingest", () => {
		it("異常系: サービスがHTTPException(404)をスローした場合、404を返す", async () => {
			mockPrService.ingestPr.mockRejectedValue(
				new HTTPException(404, { message: "Pull request not found" }),
			);
			const req = new Request(
				"http://localhost/repos/owner/repo/pulls/999/ingest",
				{ method: "POST" },
			);
			const res = await app.request(req);
			expect(res.status).toBe(404);
			const json = await res.json();
			expect(json.code).toBe("HTTP_EXCEPTION");
			expect(json.message).toBe("Pull request not found");
		});

		it("異常系: パスパラメータが不正な場合、422を返す", async () => {
			const req = new Request(
				"http://localhost/repos/owner/repo/pulls/not-a-number/ingest",
				{ method: "POST" },
			);
			const res = await app.request(req);
			expect(res.status).toBe(422);
			const json = await res.json();
			expect(json.code).toBe("VALIDATION_ERROR");
			expect(json.message).toBe("Validation Failed");
		});
	});
});
