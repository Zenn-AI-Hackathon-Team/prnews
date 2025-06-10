import { AppError } from "./AppError";

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super("VALIDATION_ERROR", message, details);
	}
}
