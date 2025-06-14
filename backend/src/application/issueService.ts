import { randomUUID } from "node:crypto";
import type { Issue, IssueArticle, IssueListItem } from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import type { GeminiPort } from "../ports/geminiPort";
import type { GithubPort } from "../ports/githubPort";
import type { IssueRepoPort } from "../ports/issueRepoPort";
import type { UserRepoPort } from "../ports/userRepoPort";
import { decrypt } from "../utils/crypto";

export const createIssueService = (deps: {
	github: GithubPort;
	gemini: GeminiPort;
	issueRepo: IssueRepoPort;
	userRepo: UserRepoPort;
}) => {
	/**
	 * 1. GitHubからIssue情報を取得し、DBに下書き保存する
	 */
	const ingestIssue = async (
		userId: string,
		owner: string,
		repo: string,
		issueNumber: number,
	): Promise<IssueArticle> => {
		const user = await deps.userRepo.findById(userId);
		if (!user?.encryptedGitHubAccessToken) {
			throw new HTTPException(403, {
				message: "GitHub access token not found.",
			});
		}
		const accessToken = decrypt(user.encryptedGitHubAccessToken);

		const issue = await deps.github.fetchIssue(
			accessToken,
			owner,
			repo,
			issueNumber,
		);
		if (!issue) {
			throw new HTTPException(404, {
				message: `Issue #${issueNumber} not found.`,
			});
		}

		const existingArticle = await deps.issueRepo.findByNumber(
			owner,
			repo,
			issueNumber,
		);
		if (existingArticle && (existingArticle as IssueArticle).id) {
			console.log(`Issue #${issueNumber} already exists in DB.`);
			return existingArticle as IssueArticle;
		}

		const newArticle: IssueArticle = {
			...issue,
			id: randomUUID(),
			contents: {},
			totalLikeCount: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await deps.issueRepo.saveArticle(newArticle);
		return newArticle;
	};

	/**
	 * 2. DBのIssueデータを元に、AIで要約記事を生成・更新する
	 */
	const generateIssueArticle = async (
		owner: string,
		repo: string,
		issueNumber: number,
	): Promise<IssueArticle> => {
		const issueData = await deps.issueRepo.findByNumber(
			owner,
			repo,
			issueNumber,
		);
		if (!issueData || !(issueData as IssueArticle).id) {
			throw new HTTPException(404, {
				message: "Issue data not found in DB. Please ingest it first.",
			});
		}

		const articleContent = await deps.gemini.summarizeIssue(issueData as Issue);

		const updatedArticle: IssueArticle = {
			...(issueData as IssueArticle),
			contents: {
				...((issueData as IssueArticle).contents ?? {}),
				ja: articleContent,
			},
			updatedAt: new Date().toISOString(),
		};

		await deps.issueRepo.saveArticle(updatedArticle);
		return updatedArticle;
	};

	/**
	 * 3. DBから生成済みの記事を取得する
	 */
	const getArticle = async (
		owner: string,
		repo: string,
		issueNumber: number,
	): Promise<IssueArticle> => {
		const article = await deps.issueRepo.findByNumber(owner, repo, issueNumber);
		if (
			!article ||
			!article.contents ||
			Object.keys(article.contents).length === 0
		) {
			throw new HTTPException(404, {
				message:
					"Generated article for this issue not found. Please generate it first.",
			});
		}
		return article;
	};

	/**
	 * 3. 指定されたリポジトリのIssue一覧を、記事の有無と合わせて取得する
	 */
	const getIssueListForRepo = async (
		userId: string,
		owner: string,
		repo: string,
		query: {
			state?: "open" | "closed" | "all";
			per_page?: number;
			page?: number;
		},
	): Promise<IssueListItem[]> => {
		// 1. ユーザーのGitHubトークンを取得
		const user = await deps.userRepo.findById(userId);
		if (!user?.encryptedGitHubAccessToken) {
			throw new HTTPException(403, {
				message: "GitHub access token is not registered.",
			});
		}
		const accessToken = decrypt(user.encryptedGitHubAccessToken);

		// 2. GitHubからIssue一覧を取得
		const githubIssues = await deps.github.listIssues(
			accessToken,
			owner,
			repo,
			{
				state: query.state ?? "open",
				per_page: query.per_page ?? 30,
				page: query.page ?? 1,
			},
		);

		if (githubIssues.length === 0) {
			return [];
		}

		// 3. DBに記事が存在するかを一括チェック
		const issueNumbers = githubIssues.map((issue) => issue.number);
		const existingArticleNumbers = await deps.issueRepo.checkArticlesExist(
			owner,
			repo,
			issueNumbers,
		);

		// 4. GitHubの情報とDBの情報をマージして、最終的なレスポンスデータを作成
		const responseData: IssueListItem[] = githubIssues.map((issue) => ({
			issueNumber: issue.number,
			title: issue.title,
			authorLogin: issue.user?.login ?? "unknown",
			githubIssueUrl: issue.html_url,
			state: issue.state,
			createdAt: issue.created_at,
			articleExists: existingArticleNumbers.includes(issue.number),
		}));

		return responseData;
	};

	return {
		ingestIssue,
		generateIssueArticle,
		getArticle,
		getIssueListForRepo,
	};
};

export type IssueService = ReturnType<typeof createIssueService>;
