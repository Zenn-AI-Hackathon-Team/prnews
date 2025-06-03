export const ErrorCode = {
	VALIDATION_ERROR: "VALIDATION_ERROR",
	UNAUTHENTICATED: "UNAUTHENTICATED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
