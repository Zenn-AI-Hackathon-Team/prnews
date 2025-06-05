import {
	type ApiResponse,
	type ErrorCode,
	errorStatusMap,
} from "@prnews/common";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** 成功レスポンス */
export const respondSuccess = <T>(
	c: Context,
	data: T,
	status: ContentfulStatusCode = 200,
	message?: string,
) => c.json({ success: true, data, message }, { status });

/** 失敗レスポンス */
export const respondError = (
	c: Context,
	code: ErrorCode,
	message?: string,
	details?: unknown,
	statusOverride?: ContentfulStatusCode,
) => {
	const statusFromMap = errorStatusMap[code] as
		| ContentfulStatusCode
		| undefined;

	const defaultErrorStatus: ContentfulStatusCode = 500;

	const resolvedStatus: ContentfulStatusCode =
		statusOverride ?? statusFromMap ?? defaultErrorStatus;

	return c.json<ApiResponse<never>>(
		{ success: false, error: { code, details }, message },
		{ status: resolvedStatus },
	);
};
