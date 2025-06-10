import { ErrorCode, errorStatusMap } from "@prnews/common";
import { createMiddleware } from "hono/factory";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "../../errors/AppError";

export const errorHandlerMiddleware = createMiddleware(async (c, next) => {
	try {
		await next();
	} catch (err) {
		if (err instanceof AppError) {
			console.warn(`[AppError] Code: ${err.code}, Message: ${err.message}`);
			const status = errorStatusMap[err.code] ?? 500;
			return c.json(
				{
					success: false,
					error: { code: err.code, details: err.details },
					message: err.message,
				},
				status as ContentfulStatusCode,
			);
		}
		console.error("[UnhandledError]", err);
		return c.json(
			{
				success: false,
				error: {
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					details: "An unexpected error occurred. Please contact support.",
				},
			},
			500,
		);
	}
});
