import { randomUUID } from "node:crypto";
import {
	type PullRequest as CommonPullRequest,
	type LikedArticleInfo,
	type PullRequestArticle as PullRequestArticleType,
	pullRequestSchema,
} from "@prnews/common";
import { articleLikeSchema } from "@prnews/common";
import { createPullRequest } from "../domain/pullRequest";
import type { PullRequestArticle } from "../domain/pullRequestArticle";
import { AppError } from "../errors/AppError";
import { ForbiddenError } from "../errors/ForbiddenError";
import { NotFoundError } from "../errors/NotFoundError";
import { ValidationError } from "../errors/ValidationError";
import type { ArticleLikeRepoPort } from "../ports/articleLikeRepoPort.js";
import type { GeminiPort } from "../ports/geminiPort.js";
import type { GithubPort } from "../ports/githubPort.js";
import type { PrRepoPort } from "../ports/prRepoPort.js";
import type { UserRepoPort } from "../ports/userRepoPort";
import { decrypt } from "../utils/crypto";

const toChangeTypeEnum = (
	arr: string[],
): (
	| "FEAT"
	| "FIX"
	| "REFACTOR"
	| "DOCS"
	| "TEST"
	| "PERF"
	| "BUILD"
	| "CHORE"
)[] =>
	arr.filter(
		(
			v,
		): v is
			| "FEAT"
			| "FIX"
			| "REFACTOR"
			| "DOCS"
			| "TEST"
			| "PERF"
			| "BUILD"
			| "CHORE" =>
			[
				"FEAT",
				"FIX",
				"REFACTOR",
				"DOCS",
				"TEST",
				"PERF",
				"BUILD",
				"CHORE",
			].includes(v),
	);

const toCategoryTypeEnum = (
	arr: string[],
): ("TECH" | "RISK" | "UX" | "PERF" | "SECURITY")[] =>
	arr.filter((v): v is "TECH" | "RISK" | "UX" | "PERF" | "SECURITY" =>
		["TECH", "RISK", "UX", "PERF", "SECURITY"].includes(v),
	);

export const createPrService = (deps: {
	github: GithubPort;
	gemini: GeminiPort;
	prRepo: PrRepoPort;
	articleLikeRepo: ArticleLikeRepoPort;
	userRepo: UserRepoPort;
}) => {
	const ingestPr = async (
		userId: string,
		owner: string,
		repo: string,
		number: number,
	) => {
		// 1. ユーザー情報を取得
		const user = await deps.userRepo.findById(userId);
		if (!user?.encryptedGitHubAccessToken) {
			throw new ForbiddenError(
				"UNAUTHENTICATED",
				"GitHub token not found for this user.",
			);
		}
		// 2. トークンを復号
		const accessToken = decrypt(user.encryptedGitHubAccessToken);
		// 3. GitHub APIからPR情報を取得
		const rawPr = await deps.github.fetchPullRequest(
			accessToken,
			owner,
			repo,
			number,
		);
		if (!rawPr) {
			throw new NotFoundError(
				`Pull request #${number} not found in ${owner}/${repo}`,
			);
		}

		// 4. ドメインオブジェクト生成
		const prProps = {
			id: randomUUID(),
			prNumber: rawPr.prNumber,
			repository: rawPr.repository,
			title: rawPr.title,
			diff: rawPr.diff,
			authorLogin: rawPr.authorLogin,
			createdAt: rawPr.createdAt,
			body: rawPr.body ?? null,
			comments: rawPr.comments ?? [],
		};
		const pr = createPullRequest(prProps);

		// 5. バリデーション
		const validation = pullRequestSchema.safeParse({
			prNumber: pr.prNumber,
			repositoryFullName: pr.repository,
			githubPrUrl: `https://github.com/${pr.repository}/pull/${pr.prNumber}`,
			title: pr.title,
			body: pr.body,
			diff: pr.diff,
			authorLogin: pr.authorLogin,
			githubPrCreatedAt: pr.createdAt,
			comments: pr.comments,
		});
		if (!validation.success) {
			throw new ValidationError(
				"PullRequest validation failed",
				validation.error.flatten().fieldErrors,
			);
		}

		// 6. 保存
		await deps.prRepo.savePullRequest(pr);

		return {
			prNumber: pr.prNumber,
			repositoryFullName: pr.repository,
			githubPrUrl: `https://github.com/${pr.repository}/pull/${pr.prNumber}`,
			title: pr.title,
			body: pr.body,
			diff: pr.diff,
			authorLogin: pr.authorLogin,
			githubPrCreatedAt: pr.createdAt,
			comments: pr.comments,
		};
	};
	const generateArticle = async (
		owner: string,
		repo: string,
		number: number,
	) => {
		const pr = await deps.prRepo.findByNumber(owner, repo, number);
		if (!pr) {
			throw new NotFoundError(
				`Pull request #${number} not found in ${owner}/${repo}`,
			);
		}

		// コメントを一つのテキストにまとめる
		const conversationText = [
			`PR本文:\n${pr.body || "本文なし"}`,
			...pr.comments.map((c) => `\n--- コメント (${c.author}) ---\n${c.body}`),
		].join("\n");

		// diffとconversationを結合
		const inputTextForAI = `## 差分情報\n\n${pr.diff}\n\n## 会話の履歴\n${conversationText}`;

		const aiResult = await deps.gemini.summarizeDiff(inputTextForAI);
		if (!aiResult || !aiResult.aiGeneratedTitle) {
			throw new AppError(
				"INTERNAL_SERVER_ERROR",
				"AI summary generation failed",
			);
		}

		const now = new Date().toISOString();
		const mainChanges = Array.isArray(aiResult.mainChanges)
			? aiResult.mainChanges.map((mc) => ({
					...mc,
					changeTypes: toChangeTypeEnum(mc.changeTypes as string[]),
				}))
			: [];
		const notablePoints = Array.isArray(aiResult.notablePoints)
			? aiResult.notablePoints
			: [];
		const article = {
			id: pr.id,
			prNumber: pr.prNumber,
			repository: pr.repository,
			title: pr.title,
			diff: pr.diff,
			authorLogin: pr.authorLogin,
			createdAt: now,
			repositoryFullName: pr.repository,
			githubPrUrl: `https://github.com/${pr.repository}/pull/${pr.prNumber}`,
			body: pr.body,
			githubPrCreatedAt: pr.createdAt,
			updatedAt: now,
			comments: pr.comments,
			contents: {
				ja: {
					aiGeneratedTitle: aiResult.aiGeneratedTitle,
					backgroundAndPurpose: aiResult.backgroundAndPurpose,
					mainChanges,
					notablePoints,
					summaryGeneratedAt: aiResult.summaryGeneratedAt,
					likeCount: 0,
				},
			},
		};

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
			body: pr.body,
			diff: pr.diff,
			authorLogin: pr.authorLogin,
			githubPrCreatedAt: pr.createdAt,
			comments: pr.comments,
		};
	};
	const getArticle = async (
		prId: string,
	): Promise<PullRequestArticleType | null> => {
		const article = await deps.prRepo.findArticleByPrId(prId);
		if (!article) {
			return null;
		}

		// Transform contents to match the expected type
		const transformedContents: Record<
			string,
			{
				aiGeneratedTitle: string;
				backgroundAndPurpose?: string;
				mainChanges?: {
					fileName: string;
					changeTypes: (
						| "FEAT"
						| "FIX"
						| "REFACTOR"
						| "DOCS"
						| "TEST"
						| "PERF"
						| "BUILD"
						| "CHORE"
					)[];
					description: string;
				}[];
				notablePoints?: {
					categories: ("TECH" | "RISK" | "UX" | "PERF" | "SECURITY")[];
					point: string;
				}[];
				summaryGeneratedAt: string;
				likeCount: number;
			}
		> = {};

		if (article.contents) {
			for (const [lang, content] of Object.entries(article.contents)) {
				transformedContents[lang] = {
					...content,
					mainChanges: content.mainChanges?.map((change) => ({
						...change,
						changeTypes: toChangeTypeEnum(change.changeTypes),
					})),
					notablePoints: content.notablePoints?.map((point) => ({
						...point,
						categories: toCategoryTypeEnum(point.categories),
					})),
				};
			}
		}

		return {
			...article,
			repositoryFullName: article.repository,
			githubPrUrl: `https://github.com/${article.repository}/pull/${article.prNumber}`,
			body: article.body,
			githubPrCreatedAt: article.createdAt,
			comments: article.comments,
			contents:
				Object.keys(transformedContents).length > 0
					? transformedContents
					: undefined,
		};
	};
	const likeArticle = async (
		userId: string,
		articleId: string,
		langCode: string,
	): Promise<
		| { alreadyLiked: boolean; likeCount: number; message: string }
		| { error: string }
	> => {
		// 記事取得
		const article = await deps.prRepo.findArticleByPrId(articleId);
		if (!article || !article.contents || !article.contents[langCode]) {
			return { error: "ARTICLE_NOT_FOUND" };
		}
		// 既にいいね済みか確認
		const existing = await deps.articleLikeRepo.findByUserIdAndArticleIdAndLang(
			userId,
			articleId,
			langCode,
		);
		const likeCount = article.contents[langCode].likeCount ?? 0;
		if (existing) {
			return { alreadyLiked: true, likeCount, message: "既にいいね済みです" };
		}
		// likeCountをトランザクションでインクリメント
		await deps.prRepo.incrementLikeCount(articleId, langCode, 1);
		// ArticleLikeレコード作成
		const like = {
			id: randomUUID(),
			userId,
			articleId,
			languageCode: langCode,
			likedAt: new Date().toISOString(),
		};
		const validation = articleLikeSchema.safeParse(like);
		if (!validation.success) {
			return { error: "VALIDATION_ERROR" };
		}
		await deps.articleLikeRepo.save(like);
		// 最新のlikeCountを取得
		const updated = await deps.prRepo.findArticleByPrId(articleId);
		const newCount = updated?.contents?.[langCode]?.likeCount ?? likeCount + 1;
		return {
			alreadyLiked: false,
			likeCount: newCount,
			message: "いいねしました",
		};
	};
	const unlikeArticle = async (
		userId: string,
		articleId: string,
		langCode: string,
	): Promise<{ likeCount: number } | { error: string }> => {
		// 記事取得
		const article = await deps.prRepo.findArticleByPrId(articleId);
		if (!article || !article.contents || !article.contents[langCode]) {
			return { error: "ARTICLE_NOT_FOUND" };
		}
		const likeCount = article.contents[langCode].likeCount ?? 0;
		// いいねレコードが存在するか確認
		const existing = await deps.articleLikeRepo.findByUserIdAndArticleIdAndLang(
			userId,
			articleId,
			langCode,
		);
		if (existing) {
			// レコード削除
			await deps.articleLikeRepo.deleteByUserIdAndArticleIdAndLang(
				userId,
				articleId,
				langCode,
			);
			// likeCountをトランザクションでデクリメント
			await deps.prRepo.incrementLikeCount(articleId, langCode, -1);
			// 最新のlikeCountを取得
			const updated = await deps.prRepo.findArticleByPrId(articleId);
			const newCount =
				updated?.contents?.[langCode]?.likeCount ?? Math.max(0, likeCount - 1);
			return { likeCount: newCount };
		}
		// もともといいねしていなかった場合も現在のlikeCountを返す
		return { likeCount };
	};
	const getLikedArticles = async (
		userId: string,
		options: {
			lang?: string;
			limit?: number;
			offset?: number;
			sort?: "likedAt_desc" | "likedAt_asc";
		} = {},
	): Promise<{ data: LikedArticleInfo[]; totalItems: number }> => {
		let likes = await deps.articleLikeRepo.findByUserId(userId);
		if (options.lang) {
			likes = likes.filter((like) => like.languageCode === options.lang);
		}
		if (options.sort === "likedAt_asc") {
			likes = likes.sort((a, b) => a.likedAt.localeCompare(b.likedAt));
		} else {
			likes = likes.sort((a, b) => b.likedAt.localeCompare(a.likedAt));
		}
		const totalItems = likes.length;
		const offset = options.offset ?? 0;
		const limit = options.limit ?? 10;
		const pagedLikes = likes.slice(offset, offset + limit);
		const articleIds = pagedLikes.map((like) => like.articleId);
		if (articleIds.length === 0) {
			return { data: [], totalItems };
		}
		let articles: PullRequestArticle[] = [];
		try {
			articles = await deps.prRepo.findArticlesByIds(articleIds);
		} catch (e) {
			console.error("findArticlesByIds error", e);
			throw new AppError(
				"INTERNAL_SERVER_ERROR",
				"記事情報の取得に失敗しました",
			);
		}
		const articleMap = new Map(articles.map((a) => [a.id, a]));
		const result: LikedArticleInfo[] = pagedLikes
			.map((like) => {
				const article = articleMap.get(like.articleId);
				if (
					!article ||
					!article.contents ||
					!article.contents[like.languageCode]
				) {
					return undefined;
				}
				const content = article.contents[like.languageCode];
				return {
					articleId: like.articleId,
					languageCode: like.languageCode,
					likedAt: like.likedAt,
					aiGeneratedTitle: content.aiGeneratedTitle,
					repositoryFullName: article.repository,
					prNumber: article.prNumber,
				};
			})
			.filter((info): info is LikedArticleInfo => info !== undefined);
		return { data: result, totalItems };
	};
	return {
		ingestPr,
		generateArticle,
		getPullRequest,
		getArticle,
		likeArticle,
		unlikeArticle,
		getLikedArticles,
	};
};

export type PrService = ReturnType<typeof createPrService>;
