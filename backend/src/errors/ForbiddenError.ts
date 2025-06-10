import { AppError } from "./AppError";

/**
 * 認可エラー・権限不足の場合のエラー
 */
export class ForbiddenError extends AppError {
	constructor(message: string, details?: unknown) {
		super("FORBIDDEN", message, details);
	}
}
