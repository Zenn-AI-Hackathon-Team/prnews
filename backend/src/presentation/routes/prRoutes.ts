import { ErrorCode, pullRequestSchema } from "@prnews/common";
import { pullRequestArticleSchema } from "@prnews/common/src/schemas/pullRequestArticleSchema";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Dependencies } from "../../config/di";
import { respondError, respondSuccess } from "../../utils/apiResponder";
import type { AuthVariables } from "../middlewares/authMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const prRoutes = new Hono<{ Variables: Dependencies & AuthVariables }>();

const ingestParamsSchema = z.object({
	owner: z.string().min(1),
	repo: z.string().min(1),
	number: z.string().regex(/^\d+$/).transform(Number),
});

const articleParamsSchema = z.object({
	owner: z.string().min(1),
	repo: z.string().min(1),
	number: z
		.string()
		.regex(/^[0-9]+$/)
		.transform(Number),
});

const getPrParamsSchema = z.object({
	owner: z.string().min(1),
	repo: z.string().min(1),
	number: z
		.string()
		.regex(/^[0-9]+$/)
		.transform(Number),
});

const getArticleParamsSchema = z.object({
	owner: z.string().min(1),
	repo: z.string().min(1),
	number: z
		.string()
		.regex(/^[0-9]+$/)
		.transform(Number),
});

prRoutes.post(
	"/repos/:owner/:repo/pulls/:number/ingest",
	validator("param", (value, c) => {
		const parsed = ingestParamsSchema.safeParse(value);
		if (!parsed.success) {
			return respondError(
				c,
				ErrorCode.VALIDATION_ERROR,
				"Invalid path parameters",
				parsed.error.flatten().fieldErrors,
			);
		}
		return parsed.data;
	}),
	async (c) => {
		const { prService } = c.var;
		const params = c.req.valid("param");

		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			return respondError(
				c,
				ErrorCode.UNAUTHENTICATED,
				"User not found in context.",
			);
		}

		try {
			const ingestedPr = await prService.ingestPr(
				authenticatedUser.id,
				params.owner,
				params.repo,
				params.number,
			);
			const validatedResponse = pullRequestSchema.safeParse(ingestedPr);
			if (!validatedResponse.success) {
				console.error("Response validation failed:", validatedResponse.error);
				return respondError(
					c,
					ErrorCode.INTERNAL_SERVER_ERROR,
					"Response data validation failed",
				);
			}
			return respondSuccess(c, validatedResponse.data);
		} catch (error: unknown) {
			console.error("Ingest PR failed:", error);
			if (
				error instanceof Error &&
				Object.values(ErrorCode).includes(error.message as ErrorCode)
			) {
				return respondError(c, error.message as ErrorCode);
			}
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"Failed to ingest pull request",
			);
		}
	},
);

prRoutes.post(
	"/repos/:owner/:repo/pulls/:number/article",
	validator("param", (value, c) => {
		const parsed = articleParamsSchema.safeParse(value);
		if (!parsed.success) {
			return respondError(
				c,
				ErrorCode.VALIDATION_ERROR,
				"Invalid path parameters for article",
				parsed.error.flatten().fieldErrors,
			);
		}
		return parsed.data;
	}),
	async (c) => {
		const { prService } = c.var;
		const params = c.req.valid("param");
		try {
			const article = await prService.generateArticle(
				params.owner,
				params.repo,
				params.number,
			);
			const validated = pullRequestArticleSchema.safeParse(article);
			if (!validated.success) {
				console.error("Article response validation failed:", validated.error);
				return respondError(
					c,
					ErrorCode.INTERNAL_SERVER_ERROR,
					"Article response data validation failed",
				);
			}
			return respondSuccess(c, validated.data);
		} catch (error: unknown) {
			console.error("Generate article failed:", error);
			if (
				typeof error === "object" &&
				error !== null &&
				"message" in error &&
				typeof (error as { message?: unknown }).message === "string" &&
				Object.values(ErrorCode).includes(
					(error as { message: string }).message as ErrorCode,
				)
			) {
				return respondError(
					c,
					(error as { message: string }).message as ErrorCode,
				);
			}
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"Failed to generate article",
			);
		}
	},
);

prRoutes.get(
	"/repos/:owner/:repo/pulls/:number",
	validator("param", (value, c) => {
		const parsed = getPrParamsSchema.safeParse(value);
		if (!parsed.success) {
			return respondError(
				c,
				ErrorCode.VALIDATION_ERROR,
				"Invalid path parameters for getting PR",
				parsed.error.flatten().fieldErrors,
			);
		}
		return parsed.data;
	}),
	async (c) => {
		const { prService } = c.var;
		const params = c.req.valid("param");
		try {
			const pr = await prService.getPullRequest(
				params.owner,
				params.repo,
				params.number,
			);
			if (!pr) {
				return respondError(
					c,
					ErrorCode.NOT_FOUND,
					"Pull request not found in cache",
				);
			}
			const validated = pullRequestSchema.safeParse(pr);
			if (!validated.success) {
				console.error("PR response validation failed:", validated.error);
				return respondError(
					c,
					ErrorCode.INTERNAL_SERVER_ERROR,
					"PR response data validation failed",
				);
			}
			return respondSuccess(c, validated.data);
		} catch (error: unknown) {
			console.error("Get PR failed:", error);
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"Failed to get pull request",
			);
		}
	},
);

prRoutes.get(
	"/repos/:owner/:repo/pulls/:number/article",
	validator("param", (value, c) => {
		const parsed = getArticleParamsSchema.safeParse(value);
		if (!parsed.success) {
			return respondError(
				c,
				ErrorCode.VALIDATION_ERROR,
				"Invalid path parameters for getting article",
				parsed.error.flatten().fieldErrors,
			);
		}
		return parsed.data;
	}),
	async (c) => {
		const { prService, prRepo } = c.var;
		const params = c.req.valid("param");
		try {
			const pullRequest = await prRepo.findByOwnerRepoNumber(
				params.owner,
				params.repo,
				params.number,
			);
			if (!pullRequest) {
				return respondError(
					c,
					ErrorCode.NOT_FOUND,
					"Original pull request not found",
				);
			}
			const prId = pullRequest.id;
			const article = await prService.getArticle(prId);
			if (!article) {
				return respondError(
					c,
					ErrorCode.NOT_FOUND,
					"Article not found for this pull request",
				);
			}
			const validated = pullRequestArticleSchema.safeParse(article);
			if (!validated.success) {
				console.error("Article response validation failed:", validated.error);
				return respondError(
					c,
					ErrorCode.INTERNAL_SERVER_ERROR,
					"Article response data validation failed",
				);
			}
			return respondSuccess(c, validated.data);
		} catch (error: unknown) {
			console.error("Get article failed:", error);
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"Failed to get article",
			);
		}
	},
);

prRoutes.post(
	"/articles/:articleId/language/:langCode/like",
	authMiddleware,
	async (c) => {
		const { prService } = c.var;
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			return respondError(
				c,
				ErrorCode.UNAUTHENTICATED,
				"User not authenticated",
			);
		}
		const { articleId, langCode } = c.req.param();
		if (
			!articleId ||
			!langCode ||
			typeof articleId !== "string" ||
			typeof langCode !== "string" ||
			langCode.length !== 2
		) {
			return respondError(
				c,
				ErrorCode.VALIDATION_ERROR,
				"パスパラメータが不正です",
			);
		}
		const result = await prService.likeArticle(
			authenticatedUser.id,
			articleId,
			langCode,
		);
		if ("error" in result) {
			if (result.error === "ARTICLE_NOT_FOUND") {
				return respondError(
					c,
					ErrorCode.ARTICLE_NOT_FOUND,
					"指定された記事が見つかりません。",
					undefined,
					404,
				);
			}
			if (result.error === "VALIDATION_ERROR") {
				return respondError(
					c,
					ErrorCode.VALIDATION_ERROR,
					"バリデーションエラー",
				);
			}
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"サーバー内部エラー",
			);
		}
		if (result.alreadyLiked) {
			return respondSuccess(
				c,
				{ message: result.message, likeCount: result.likeCount },
				200,
				result.message,
			);
		}
		return respondSuccess(
			c,
			{ message: result.message, likeCount: result.likeCount },
			201,
			result.message,
		);
	},
);

prRoutes.delete(
	"/articles/:articleId/language/:langCode/like",
	authMiddleware,
	async (c) => {
		const { prService } = c.var;
		const authenticatedUser = c.var.user;
		if (!authenticatedUser) {
			return respondError(
				c,
				ErrorCode.UNAUTHENTICATED,
				"User not authenticated",
			);
		}
		const { articleId, langCode } = c.req.param();
		if (
			!articleId ||
			!langCode ||
			typeof articleId !== "string" ||
			typeof langCode !== "string" ||
			langCode.length !== 2
		) {
			return respondError(
				c,
				ErrorCode.VALIDATION_ERROR,
				"パスパラメータが不正です",
			);
		}
		const result = await prService.unlikeArticle(
			authenticatedUser.id,
			articleId,
			langCode,
		);
		if ("error" in result) {
			if (result.error === "ARTICLE_NOT_FOUND") {
				return respondError(
					c,
					ErrorCode.ARTICLE_NOT_FOUND,
					"指定された記事が見つかりません。",
					undefined,
					404,
				);
			}
			return respondError(
				c,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"サーバー内部エラー",
			);
		}
		return respondSuccess(c, { likeCount: result.likeCount }, 200);
	},
);

export default prRoutes;
