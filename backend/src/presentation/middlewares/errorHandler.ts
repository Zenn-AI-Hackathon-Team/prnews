import { ErrorCode } from "@prnews/common";
import { createMiddleware } from "hono/factory";
import { AppError } from "../../errors/AppError";
import { respondError } from "../../utils/apiResponder";

export const errorHandlerMiddleware = createMiddleware(async (c, next) => {
	try {
		await next();
	} catch (err) {
		if (err instanceof AppError) {
			console.warn(`[AppError] Code: ${err.code}, Message: ${err.message}`);
			return respondError(c, err.code, err.message, err.details);
		}

		console.error("[UnhandledError]", err);
		return respondError(
			c,
			ErrorCode.INTERNAL_SERVER_ERROR,
			"An unexpected error occurred. Please contact support.",
		);
	}
});
