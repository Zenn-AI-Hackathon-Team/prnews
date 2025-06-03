import { Context } from 'hono';
import type { ApiResponse, ErrorCode } from '@prnews/common';
import { errorStatusMap } from '@prnews/common';

/** 成功レスポンス */
export const respondSuccess = <T>(
  c: Context,
  data: T,
  status: number = 200,
  message?: string,
) =>
  c.json<ApiResponse<T>>({ success: true, data, message }, status);

/** 失敗レスポンス（ステータス自動設定） */
export const respondError = (
  c: Context,
  code: ErrorCode,
  message?: string,
  details?: unknown,
  statusOverride?: number,  // 例外的に上書きしたいときだけ指定
) => {
  const status = statusOverride ?? errorStatusMap[code] ?? 500;
  return c.json<ApiResponse<never>>(
    { success: false, error: { code, details }, message },
    status,
  );
};
