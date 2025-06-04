import { z } from "zod";

export const favoriteRepositorySchema = z.object({
	id: z.string().uuid().describe("お気に入り登録自体のユニークID"),
	userId: z.string().uuid().describe("ユーザーID"),
	githubRepoId: z
		.number()
		.int()
		.positive()
		.describe("GitHubリポジトリの数値ID"),
	repositoryFullName: z
		.string()
		.min(3)
		.regex(/^[^/]+\/[^/]+$/)
		.describe("リポジトリのフルネーム (owner/repo)"),
	owner: z.string().min(1).describe("リポジトリのオーナー名"),
	repo: z.string().min(1).describe("リポジトリ名"),
	registeredAt: z.string().datetime().describe("お気に入り登録日時"),
	// tags: z.array(z.string()).optional().describe("ユーザータグ"),
	// memo: z.string().optional().describe("ユーザーメモ"),
});

export type FavoriteRepository = z.infer<typeof favoriteRepositorySchema>;
