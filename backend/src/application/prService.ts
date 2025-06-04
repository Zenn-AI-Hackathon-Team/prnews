import {
	type PullRequest as CommonPullRequest,
	type PullRequestArticle as PullRequestArticleType,
	pullRequestSchema,
} from "@prnews/common";
import { ErrorCode } from "@prnews/common";
import { createPullRequest } from "../domain/pullRequest";
import type { GeminiPort } from "../ports/geminiPort.js";
import type { GithubPort } from "../ports/githubPort.js";
import type { PrRepoPort } from "../ports/prRepoPort.js";

export const createPrService = (deps: {
	github: GithubPort;
	gemini: GeminiPort;
	prRepo: PrRepoPort;
}) => {
	const ingestPr = async (owner: string, repo: string, number: number) => {
		// 1. GitHub (モック) からPR情報を取得
		const rawPr = await deps.github.fetchPullRequest(owner, repo, number);
		if (!rawPr) {
			throw new Error(ErrorCode.NOT_FOUND);
		}

		// 2. ドメインオブジェクト生成
		const prProps = {
			prNumber: rawPr.prNumber,
			repository: rawPr.repository,
			title: rawPr.title,
			diff: rawPr.diff,
			authorLogin: rawPr.authorLogin,
			createdAt: rawPr.createdAt,
		};
		const pr = createPullRequest(prProps);

		// 3. バリデーション
		const validation = pullRequestSchema.safeParse({
			prNumber: pr.prNumber,
			repositoryFullName: pr.repository,
			githubPrUrl: `https://github.com/${pr.repository}/pull/${pr.prNumber}`,
			title: pr.title,
			body: null,
			diff: pr.diff,
			authorLogin: pr.authorLogin,
			githubPrCreatedAt: pr.createdAt,
		});
		if (!validation.success) {
			throw new Error(ErrorCode.VALIDATION_ERROR);
		}

		// 4. 保存
		await deps.prRepo.savePullRequest(pr);

		return {
			prNumber: pr.prNumber,
			repositoryFullName: pr.repository,
			githubPrUrl: `https://github.com/${pr.repository}/pull/${pr.prNumber}`,
			title: pr.title,
			body: null,
			diff: pr.diff,
			authorLogin: pr.authorLogin,
			githubPrCreatedAt: pr.createdAt,
		};
	};
	const generateArticle = async (
		owner: string,
		repo: string,
		number: number,
	) => {
		// 1. PR取得
		const pr = await deps.prRepo.findByNumber(owner, repo, number);
		if (!pr) {
			throw new Error(ErrorCode.NOT_FOUND);
		}

		// 2. Geminiで要約生成
		const aiResult = await deps.gemini.summarizeDiff(pr.diff);
		if (!aiResult || !aiResult.aiGeneratedTitle) {
			throw new Error(ErrorCode.INTERNAL_SERVER_ERROR);
		}

		// 3. PullRequestArticle生成
		const {
			aiGeneratedTitle,
			backgroundAndPurpose,
			mainChanges,
			notablePoints,
			summaryGeneratedAt,
		} = aiResult;
		const article = {
			...pr,
			aiGeneratedTitle,
			backgroundAndPurpose,
			mainChanges,
			notablePoints,
			summaryGeneratedAt,
		};

		// 4. 保存
		await deps.prRepo.saveArticle(article);

		return article;
	};
	const getPullRequest = async (
		owner: string,
		repo: string,
		pullNumber: number,
	): Promise<CommonPullRequest | null> => {
		const pr = await deps.prRepo.findByOwnerRepoNumber(owner, repo, pullNumber);
		if (!pr) {
			return null;
		}
		// APIスキーマに整形
		return {
			prNumber: pr.prNumber,
			repositoryFullName: pr.repository,
			githubPrUrl: `https://github.com/${pr.repository}/pull/${pr.prNumber}`,
			title: pr.title,
			body: null, // 現状bodyはnull固定
			diff: pr.diff,
			authorLogin: pr.authorLogin,
			githubPrCreatedAt: pr.createdAt,
		};
	};
	const getArticle = async (
		prId: string,
	): Promise<PullRequestArticleType | null> => {
		const article = await deps.prRepo.findArticleByPrId(prId);
		if (!article) {
			return null;
		}
		return {
			...article,
			repositoryFullName: article.repository,
			githubPrUrl: `https://github.com/${article.repository}/pull/${article.prNumber}`,
			body: null,
			githubPrCreatedAt: article.createdAt,
		};
	};
	return { ingestPr, generateArticle, getPullRequest, getArticle };
};
