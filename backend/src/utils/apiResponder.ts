import {
	type ErrorCode,
	type ErrorResponse,
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

	const errorBody: ErrorResponse = {
		success: false,
		error: { code, details },
		message,
	};

	return c.json(errorBody, { status: resolvedStatus });
};

/** openapiルート用の成功レスポンス。ステータスコードの型を固定できる。 */
export const respondOpenApiSuccess = <
	TData,
	TStatus extends ContentfulStatusCode,
>(
	c: Context,
	data: TData,
	status: TStatus,
) => {
	return c.json(
		{
			success: true as const,
			data,
		},
		{ status },
	);
};

/** openapiルート用の失敗レスポンス。ステータスコードの型を固定できる。 */
export const respondOpenApiError = <TStatus extends ContentfulStatusCode>(
	c: Context,
	errorData: { code: ErrorCode; details?: unknown; message?: string },
	status: TStatus,
) => {
	return c.json(
		{
			success: false as const,
			error: {
				code: errorData.code,
				details: errorData.details,
			},
			message: errorData.message,
		},
		{ status },
	);
};
