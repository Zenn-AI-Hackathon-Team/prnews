import type { ErrorCode } from "./errorCodes";

export const errorStatusMap: Record<ErrorCode, number> = {
	VALIDATION_ERROR: 422,
	UNAUTHENTICATED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
};
