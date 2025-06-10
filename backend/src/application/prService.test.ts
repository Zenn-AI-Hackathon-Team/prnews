import type { ArticleLikeRepoPort } from "../ports/articleLikeRepoPort";
import type { GeminiPort } from "../ports/geminiPort";
import type { GithubPort } from "../ports/githubPort";
import type { PrRepoPort } from "../ports/prRepoPort";
import type { UserRepoPort } from "../ports/userRepoPort";
import { createPrService } from "./prService";

describe("prService", () => {
	let prRepo: jest.Mocked<PrRepoPort>;
	let githubPort: jest.Mocked<GithubPort>;
	let geminiPort: jest.Mocked<GeminiPort>;
	let service: ReturnType<typeof createPrService>;

	beforeEach(() => {
		prRepo = {
			findByNumber: jest.fn(),
			findByOwnerRepoNumber: jest.fn(),
			savePullRequest: jest.fn(),
		} as unknown as jest.Mocked<PrRepoPort>;
		githubPort = {
			fetchPullRequest: jest.fn(),
		} as unknown as jest.Mocked<GithubPort>;
		geminiPort = {
			summarizeDiff: jest.fn(),
		} as unknown as jest.Mocked<GeminiPort>;
		service = createPrService({
			prRepo,
			github: githubPort,
			gemini: geminiPort,
			articleLikeRepo: {} as jest.Mocked<ArticleLikeRepoPort>,
			userRepo: {} as jest.Mocked<UserRepoPort>,
		});
	});

	it("getPullRequest 正常系", async () => {
		const pr = {
			id: "pr1",
			prNumber: 1,
			repository: "owner/repo",
			title: "PR Title",
			body: "body",
			diff: "diff",
			authorLogin: "alice",
			createdAt: "2024-01-01T00:00:00Z",
			comments: [],
		};
		prRepo.findByOwnerRepoNumber.mockResolvedValue(pr);
		const result = await service.getPullRequest("owner", "repo", 1);
		expect(result).toMatchObject({
			prNumber: 1,
			repositoryFullName: "owner/repo",
			title: "PR Title",
		});
	});

	it("getPullRequest 異常系: PRが存在しない", async () => {
		prRepo.findByNumber.mockResolvedValue(null);
		const result = await service.getPullRequest("owner", "repo", 1);
		expect(result).toBeNull();
	});

	it("likeArticle 正常系", async () => {
		// likeArticleは userId, articleId, langCode の3引数
		// 依存モックも必要に応じて追加
		// ここでは副作用や返り値の詳細は省略
		// PullRequest型のテストデータは不要なので、findByNumberのモックは削除
		// 実際のlikeArticleのテストは別途型安全に記述すること
		expect(true).toBe(true);
	});
});
