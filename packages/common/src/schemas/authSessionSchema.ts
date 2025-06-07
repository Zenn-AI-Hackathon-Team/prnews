// authSessionSchema.ts
import { z } from "zod";

export const authSessionSchema = z.object({
	id: z.string().uuid("セッション ID は UUID 形式で入力してください"),
	userId: z.string().uuid("User ID は UUID 形式で入力してください"),
	firebaseUid: z.string(),
	tokenHash: z
		.string()
		.length(64, "tokenHash は 64 文字の SHA-256 値を指定してください"),
	expiresAt: z.string().datetime("正しい日時形式で入力してください"),
	createdAt: z.string().datetime("正しい日時形式で入力してください"),
	revokedAt: z
		.string()
		.datetime("正しい日時形式で入力してください")
		.nullable()
		.optional(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;
