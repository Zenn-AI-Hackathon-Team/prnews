import { ErrorCode, pullRequestSchema } from "@prnews/common";
import { pullRequestArticleSchema } from "@prnews/common/src/schemas/pullRequestArticleSchema";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Dependencies } from "../../config/di";
import { respondError, respondSuccess } from "../../utils/apiResponder";

const prRoutes = new Hono<{ Variables: Dependencies }>();

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
		try {
			const ingestedPr = await prService.ingestPr(
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
			// TODO: ここのanyをなんとかしたい
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			console.error("Ingest PR failed:", error);
			if (Object.values(ErrorCode).includes(error.message as ErrorCode)) {
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

export default prRoutes;
