import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
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
		defaultHook: (result, c) => {
			if (!result.success) {
				throw new HTTPException(422, {
					message: "Validation Failed",
					cause: result.error,
				});
			}
		},
	});
};
