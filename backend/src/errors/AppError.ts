import type { ErrorCode } from "@prnews/common";

/**
 * アプリケーションエラーの基底クラス
 */
export class AppError extends Error {
	public readonly code: ErrorCode;
	public readonly details?: unknown;

	constructor(code: ErrorCode, message: string, details?: unknown) {
		super(message);
		this.code = code;
		this.details = details;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
