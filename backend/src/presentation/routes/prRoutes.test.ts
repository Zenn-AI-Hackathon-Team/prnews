import type { PullRequest } from "@prnews/common";
import { Hono } from "hono";
import type { PrService } from "../../application/prService";
import prRoutes from "./prRoutes";

type TestVariables = {
	prService: jest.Mocked<PrService>;
};

const prMock: PullRequest = {
	prNumber: 1,
	repositoryFullName: "owner/repo",
	githubPrUrl: "https://github.com/owner/repo/pull/1",
	title: "PR Title",
	body: "PR body",
	diff: "diff",
	authorLogin: "author",
	githubPrCreatedAt: "2024-01-01T00:00:00Z",
	comments: [],
};

describe("prRoutes", () => {
	let app: Hono<{ Variables: TestVariables }>;
	let mockPrService: jest.Mocked<PrService>;

	beforeEach(() => {
		mockPrService = {
			getPullRequest: jest.fn(),
			getPullRequests: jest.fn(),
			likeArticle: jest.fn(),
		} as unknown as jest.Mocked<PrService>;
		app = new Hono<{ Variables: TestVariables }>();
		app.use("*", async (c, next) => {
			c.set("prService", mockPrService);
			await next();
		});
		app.route("/", prRoutes);
	});

	it("GET /prs/:id 正常系", async () => {
		mockPrService.getPullRequest.mockResolvedValue(prMock);
		const req = new Request("http://localhost/prs/pr1");
		const res = await app.request(req);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data).toEqual(prMock);
	});

	it("GET /prs/:id 異常系: PRが存在しない", async () => {
		mockPrService.getPullRequest.mockResolvedValue(null);
		const req = new Request("http://localhost/prs/notfound");
		const res = await app.request(req);
		expect(res.status).toBe(404);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error.code).toBeDefined();
	});

	it("POST /prs/:id/like 正常系", async () => {
		mockPrService.likeArticle.mockResolvedValue({
			alreadyLiked: false,
			likeCount: 1,
			message: "liked",
		});
		const req = new Request("http://localhost/prs/pr1/like", {
			method: "POST",
		});
		const res = await app.request(req);
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.success).toBe(true);
		expect(json.data.likeCount).toBe(1);
	});

	it("POST /prs/:id/like 異常系: 認証エラー", async () => {
		mockPrService.likeArticle.mockImplementation(() => {
			throw { code: "UNAUTHENTICATED" };
		});
		const req = new Request("http://localhost/prs/pr1/like", {
			method: "POST",
		});
		const res = await app.request(req);
		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json.success).toBe(false);
		expect(json.error.code).toBe("UNAUTHENTICATED");
	});
});
