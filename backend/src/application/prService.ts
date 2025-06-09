import { randomUUID } from "node:crypto";
import {
	type PullRequest as CommonPullRequest,
	type LikedArticleInfo,
	type PullRequestArticle as PullRequestArticleType,
	pullRequestSchema,
} from "@prnews/common";
import { articleLikeSchema } from "@prnews/common";
import { HTTPException } from "hono/http-exception";
import { createPullRequest } from "../domain/pullRequest";
import type { PullRequestArticle } from "../domain/pullRequestArticle";
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
			throw new HTTPException(403, {
				message: "GitHub token not found for this user.",
			});
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
			throw new HTTPException(404, {
				message: `Pull request #${number} not found in ${owner}/${repo}`,
			});
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
			throw new HTTPException(422, {
				message: "PullRequest validation failed",
				cause: validation.error.flatten().fieldErrors,
			});
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
			throw new HTTPException(404, {
				message: `Pull request #${number} not found in ${owner}/${repo}`,
			});
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
			throw new HTTPException(500, { message: "AI summary generation failed" });
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
	): Promise<CommonPullRequest> => {
		const pr = await deps.prRepo.findByOwnerRepoNumber(owner, repo, pullNumber);
		if (!pr) {
			throw new HTTPException(404, {
				message: "指定されたプルリクエストが見つかりません。",
			});
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
	const getArticle = async (prId: string): Promise<PullRequestArticleType> => {
		const article = await deps.prRepo.findArticleByPrId(prId);
		if (!article) {
			throw new HTTPException(404, {
				message: "指定された記事が見つかりません。",
			});
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
			totalLikeCount: article.totalLikeCount ?? 0,
		};
	};
	const likeArticle = async (
		userId: string,
		articleId: string,
		langCode: string,
	): Promise<{ alreadyLiked: boolean; likeCount: number; message: string }> => {
		return await deps.prRepo.executeTransaction(async (tx) => {
			const article = await deps.prRepo.findArticleByPrId(articleId, tx);
			if (!article || !article.contents || !article.contents[langCode]) {
				throw new HTTPException(404, {
					message: "指定された記事または言語版が見つかりません。",
				});
			}
			const existing =
				await deps.articleLikeRepo.findByUserIdAndArticleIdAndLang(
					userId,
					articleId,
					langCode,
					tx,
				);
			const likeCount = article.contents[langCode].likeCount ?? 0;
			if (existing) {
				return { alreadyLiked: true, likeCount, message: "既にいいね済みです" };
			}
			await deps.prRepo.incrementLikeCount(articleId, langCode, 1, tx);
			const like = {
				id: randomUUID(),
				userId,
				articleId,
				languageCode: langCode,
				likedAt: new Date().toISOString(),
			};
			const validation = articleLikeSchema.safeParse(like);
			if (!validation.success) {
				throw new HTTPException(422, {
					message: "Likeデータのバリデーションに失敗しました",
					cause: validation.error.flatten().fieldErrors,
				});
			}
			await deps.articleLikeRepo.save(like, tx);
			return {
				alreadyLiked: false,
				likeCount: likeCount + 1,
				message: "いいねしました",
			};
		});
	};
	const unlikeArticle = async (
		userId: string,
		articleId: string,
		langCode: string,
	): Promise<{ likeCount: number }> => {
		return await deps.prRepo.executeTransaction(async (tx) => {
			const article = await deps.prRepo.findArticleByPrId(articleId, tx);
			if (!article || !article.contents || !article.contents[langCode]) {
				throw new HTTPException(404, {
					message: "指定された記事または言語版が見つかりません。",
				});
			}
			const likeCount = article.contents[langCode].likeCount ?? 0;
			const existing =
				await deps.articleLikeRepo.findByUserIdAndArticleIdAndLang(
					userId,
					articleId,
					langCode,
					tx,
				);
			if (existing) {
				await deps.articleLikeRepo.deleteByUserIdAndArticleIdAndLang(
					userId,
					articleId,
					langCode,
					tx,
				);
				await deps.prRepo.incrementLikeCount(articleId, langCode, -1, tx);
				return { likeCount: likeCount > 0 ? likeCount - 1 : 0 };
			}
			// もともといいねしていなかった場合も現在のlikeCountを返す
			return { likeCount };
		});
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
			throw new HTTPException(500, { message: "記事情報の取得に失敗しました" });
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
	const getPullRequestListForRepo = async (
		userId: string,
		owner: string,
		repo: string,
		query: {
			state?: "open" | "closed" | "all";
			per_page?: number;
			page?: number;
		},
	) => {
		console.log(
			`[prService] 1. getPullRequestListForRepo 開始: ${owner}/${repo}`,
		);
		try {
			console.log(`[prService] 2. ユーザー検索 (ID: ${userId})`);
			const user = await deps.userRepo.findById(userId);
			if (!user?.encryptedGitHubAccessToken) {
				console.error(
					"[prService] 致命的エラー: ユーザーかGitHubトークンが見つかりません。",
				);
				throw new HTTPException(403, {
					message: "GitHub access token is not registered.",
				});
			}

			console.log("[prService] 3. ユーザー発見。トークンを復号します。");
			const accessToken = decrypt(user.encryptedGitHubAccessToken);

			const perPage =
				query.per_page && query.per_page > 0 && query.per_page <= 100
					? query.per_page
					: 30;
			const page = query.page && query.page > 0 ? query.page : 1;
			const state = query.state || "open";
			console.log(
				`[prService] 4. GitHub APIを呼び出します (page: ${page}, per_page: ${perPage}, state: ${state})`,
			);

			const githubPrs = await deps.github.listPullRequests(
				accessToken,
				owner,
				repo,
				{
					state,
					per_page: perPage,
					page,
				},
			);
			console.log(
				`[prService] 5. GitHub APIが ${githubPrs.length} 件のPRを返しました。`,
			);

			if (githubPrs.length === 0) {
				console.log(
					"[prService] GitHub上にPRがないため、空のリストを返します。",
				);
				return [];
			}

			const prNumbers = githubPrs.map((pr) => pr.number ?? pr.number);
			console.log(
				`[prService] 6. DBに記事の有無を問い合わせます (PR番号: ${prNumbers.join(", ")})`,
			);
			const existingArticleNumbers = await deps.prRepo.checkArticlesExist(
				owner,
				repo,
				prNumbers,
			);
			console.log(
				`[prService] 7. DB内に ${existingArticleNumbers.length} 件の記事を発見しました。`,
			);

			console.log("[prService] 8. 最終データを結合して返却します。");
			const responseData = githubPrs.map((pr) => ({
				prNumber: pr.number,
				title: pr.title,
				authorLogin: pr.user?.login ?? "unknown",
				githubPrUrl: pr.html_url,
				state: pr.state,
				createdAt: pr.created_at,
				articleExists: existingArticleNumbers.includes(pr.number),
			}));

			return responseData;
		} catch (error) {
			console.error(
				"[prService] getPullRequestListForRepoの内部で予期せぬエラーが発生しました！:",
				error,
			);
			// エラーを再度スローして、ルートハンドラに処理を渡す
			throw error;
		}
	};
	return {
		ingestPr,
		generateArticle,
		getPullRequest,
		getArticle,
		likeArticle,
		unlikeArticle,
		getLikedArticles,
		getPullRequestListForRepo,
	};
};

export type PrService = ReturnType<typeof createPrService>;
