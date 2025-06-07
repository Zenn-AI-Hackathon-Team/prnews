import { randomUUID } from "node:crypto";
import {
	type PullRequest as CommonPullRequest,
	type LikedArticleInfo,
	type PullRequestArticle as PullRequestArticleType,
	likedArticleInfoSchema,
	pullRequestSchema,
} from "@prnews/common";
import { ErrorCode } from "@prnews/common";
import { articleLikeSchema } from "@prnews/common";
import { createPullRequest } from "../domain/pullRequest";
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
			throw new Error("GitHub token not found for this user.");
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
			throw new Error(ErrorCode.NOT_FOUND);
		}

		// 4. ドメインオブジェクト生成
		const prProps = {
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
			throw new Error(ErrorCode.VALIDATION_ERROR);
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
		// 1. PR取得
		const pr = await deps.prRepo.findByNumber(owner, repo, number);
		if (!pr) {
			throw new Error(ErrorCode.NOT_FOUND);
		}

		// コメントを一つのテキストにまとめる
		const conversationText = [
			`PR本文:\n${pr.body || "本文なし"}`,
			...pr.comments.map((c) => `\n--- コメント (${c.author}) ---\n${c.body}`),
		].join("\n");

		// diffとconversationを結合
		const inputTextForAI = `## 差分情報\n\n${pr.diff}\n\n## 会話の履歴\n${conversationText}`;

		// 2. Geminiで要約生成（入力情報を変更）
		const aiResult = await deps.gemini.summarizeDiff(inputTextForAI);
		if (!aiResult || !aiResult.aiGeneratedTitle) {
			throw new Error(ErrorCode.INTERNAL_SERVER_ERROR);
		}

		// 3. PullRequestArticle生成
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
			const totalItems = likes.length;
			const offset = options.offset ?? 0;
			const limit = options.limit ?? 10;
			const pagedLikes = likes.slice(offset, offset + limit);
			const result: LikedArticleInfo[] = [];
			for (const like of pagedLikes) {
				const article = await deps.prRepo.findArticleByPrId(like.articleId);
				if (
					!article ||
					!article.contents ||
					!article.contents[like.languageCode]
				)
					continue;
				const content = article.contents[like.languageCode];
				result.push({
					articleId: like.articleId,
					languageCode: like.languageCode,
					likedAt: like.likedAt,
					aiGeneratedTitle: content.aiGeneratedTitle,
					repositoryFullName: article.repository,
					prNumber: article.prNumber,
					// articleUrl: ... 必要なら生成
				});
			}
			return { data: result, totalItems };
		}
		// desc（デフォルト）
		likes = likes.sort((a, b) => b.likedAt.localeCompare(a.likedAt));
		const totalItems = likes.length;
		const offset = options.offset ?? 0;
		const limit = options.limit ?? 10;
		const pagedLikes = likes.slice(offset, offset + limit);
		const result: LikedArticleInfo[] = [];
		for (const like of pagedLikes) {
			const article = await deps.prRepo.findArticleByPrId(like.articleId);
			if (!article || !article.contents || !article.contents[like.languageCode])
				continue;
			const content = article.contents[like.languageCode];
			result.push({
				articleId: like.articleId,
				languageCode: like.languageCode,
				likedAt: like.likedAt,
				aiGeneratedTitle: content.aiGeneratedTitle,
				repositoryFullName: article.repository,
				prNumber: article.prNumber,
				// articleUrl: ... 必要なら生成
			});
		}
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
