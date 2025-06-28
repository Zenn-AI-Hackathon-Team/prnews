import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono"; // Context をインポート
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { Dependencies } from "../config/di";
import type { AuthVariables } from "./middlewares/authMiddleware";

// サブアプリ（ルーター）を生成するためのファクトリ関数
export const createApp = <
	T extends object = Dependencies & AuthVariables,
>() => {
	return new OpenAPIHono<{
		Variables: T;
	}>({
		// バリデーションフックをここで一元管理する
		defaultHook: (
			result: { success: boolean; error?: ZodError; data?: unknown }, // result の型を明示的に指定
			c: Context, // c の型を明示的に指定
		) => {
			if (!result.success) {
				if (result.error instanceof ZodError) {
					throw new HTTPException(422, {
						message: "Validation Failed",
						cause: result.error.issues,
					});
				}
				throw new HTTPException(422, {
					message: "Validation Failed",
					cause: result.error,
				});
			}
		},
	});
};
