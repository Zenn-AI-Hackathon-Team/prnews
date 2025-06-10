import { AppError } from "./AppError";

/**
 * リソースが見つからない場合のエラー
 */
export class NotFoundError extends AppError {
	constructor(message: string, details?: unknown) {
		super("NOT_FOUND", message, details);
	}
}
