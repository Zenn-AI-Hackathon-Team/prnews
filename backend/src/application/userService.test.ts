import type { AuthSession } from "../domain/authSession";
import type { User } from "../domain/user";
import { NotFoundError } from "../errors/NotFoundError";
import type { AuthSessionRepoPort } from "../ports/authSessionRepoPort";
import type { FavoriteRepositoryRepoPort } from "../ports/favoriteRepositoryRepoPort";
import type { GithubPort } from "../ports/githubPort";
import type { UserRepoPort } from "../ports/userRepoPort";
import type { AuthenticatedUser } from "../presentation/middlewares/authMiddleware";
import { decrypt } from "../utils/crypto";
import { createUserService } from "./userService";

// cryptoモジュールをモック化
jest.mock("../utils/crypto", () => ({
	decrypt: jest.fn(),
}));

describe("userService", () => {
	let userRepo: jest.Mocked<UserRepoPort>;
	let authSessionRepo: jest.Mocked<AuthSessionRepoPort>;
	let favoriteRepositoryRepo: jest.Mocked<FavoriteRepositoryRepoPort>;
	let githubPort: jest.Mocked<GithubPort>;
	let service: ReturnType<typeof createUserService>;

	beforeEach(() => {
		userRepo = {
			findById: jest.fn(),
			findByFirebaseUid: jest.fn(),
			save: jest.fn(),
			findByGithubUserId: jest.fn(),
			update: jest.fn(),
		} as unknown as jest.Mocked<UserRepoPort>;
		authSessionRepo = {
			findByFirebaseUidActiveSession: jest.fn(),
			update: jest.fn(),
			save: jest.fn(),
		} as unknown as jest.Mocked<AuthSessionRepoPort>;
		favoriteRepositoryRepo = {
			findByUserIdAndGithubRepoId: jest.fn(),
			save: jest.fn(),
			findByUserId: jest.fn(),
			delete: jest.fn(),
			findById: jest.fn(),
		} as unknown as jest.Mocked<FavoriteRepositoryRepoPort>;
		githubPort = {
			fetchPullRequest: jest.fn(),
			getRepositoryByOwnerAndRepo: jest.fn(),
			getAuthenticatedUserInfo: jest.fn(),
		} as unknown as jest.Mocked<GithubPort>;
		service = createUserService({
			userRepo,
			authSessionRepo,
			favoriteRepositoryRepo,
			githubPort,
		});
	});

	describe("getCurrentUser", () => {
		it("認証済みユーザーが存在する場合、ユーザー情報を返す", async () => {
			const user: User = {
				id: "u1",
				githubUserId: 1,
				githubUsername: "foo",
				language: "ja",
				firebaseUid: "f1",
				githubDisplayName: "Foo",
				email: "foo@example.com",
				avatarUrl: "http://example.com/avatar.png",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			userRepo.findById.mockResolvedValue(user);
			const authUser: AuthenticatedUser = {
				id: "u1",
				firebaseUid: "f1",
				githubUsername: "foo",
				githubDisplayName: "Foo",
				email: "foo@example.com",
				avatarUrl: "http://example.com/avatar.png",
			};
			const result = await service.getCurrentUser(authUser);
			expect(result).toEqual(user);
		});
		it("認証済みユーザーが存在しない場合、nullを返す", async () => {
			userRepo.findById.mockResolvedValue(null);
			const authUser: AuthenticatedUser = {
				id: "u2",
				firebaseUid: "f2",
				githubUsername: "bar",
				githubDisplayName: "Bar",
				email: "bar@example.com",
				avatarUrl: "http://example.com/avatar.png",
			};
			const result = await service.getCurrentUser(authUser);
			expect(result).toBeNull();
		});
		it("未認証の場合、nullを返す", async () => {
			const result = await service.getCurrentUser(undefined);
			expect(result).toBeNull();
		});
	});

	describe("createUser", () => {
		it("新規ユーザーが正常に作成される", async () => {
			userRepo.findByFirebaseUid.mockResolvedValueOnce(null);
			userRepo.findByFirebaseUid.mockResolvedValueOnce({
				id: "u2",
				firebaseUid: "f2",
				githubUsername: "bar",
				githubUserId: 54321,
				language: "en",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				encryptedGitHubAccessToken: "encrypted-token-string",
			});

			(decrypt as jest.Mock).mockReturnValue("decrypted-access-token");

			(githubPort.getAuthenticatedUserInfo as jest.Mock).mockResolvedValue({
				id: 54321,
				login: "bar_from_github",
				name: "Bar Display Name",
				email: "bar@github.com",
				avatar_url: "http://example.com/bar.png",
			});

			userRepo.save.mockImplementation(async (u: User) => u);

			const authUser: AuthenticatedUser = {
				id: "u2",
				firebaseUid: "f2",
				githubUsername: "bar",
			};
			const result = await service.createUser(authUser, "en");

			expect(result).not.toBeNull();
			expect(result?.githubUserId).toBe(54321);
			expect(result?.githubUsername).toBe("bar_from_github");
			expect(result?.language).toBe("en");
			expect(result?.firebaseUid).toBe("f2");
		});
		it("既存ユーザーがいる場合はnull", async () => {
			const existingUser: User = {
				id: "u2",
				githubUserId: 2,
				githubUsername: "bar",
				language: "en",
				firebaseUid: "f2",
				githubDisplayName: "Bar",
				email: "bar@example.com",
				avatarUrl: "http://example.com/avatar.png",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			userRepo.findByFirebaseUid.mockResolvedValue(existingUser);
			const authUser: AuthenticatedUser = {
				id: "u2",
				firebaseUid: "f2",
				githubUsername: "bar",
				githubDisplayName: "Bar",
				email: "bar@example.com",
				avatarUrl: "http://example.com/avatar.png",
			};
			const result = await service.createUser(authUser, "en");
			expect(result).toBeNull();
		});
		it("未認証の場合はnull", async () => {
			const result = await service.createUser(undefined, "en");
			expect(result).toBeNull();
		});
	});

	describe("logoutUser", () => {
		it("未認証の場合は失敗", async () => {
			const result = await service.logoutUser(undefined);
			expect(result.success).toBe(false);
		});
		it("アクティブセッションがない場合は成功", async () => {
			authSessionRepo.findByFirebaseUidActiveSession.mockResolvedValue(null);
			const authUser: AuthenticatedUser = {
				id: "u3",
				firebaseUid: "f3",
				githubUsername: "baz",
				githubDisplayName: "Baz",
				email: "baz@example.com",
				avatarUrl: "http://example.com/avatar.png",
			};
			const result = await service.logoutUser(authUser);
			expect(result.success).toBe(true);
		});
		it("アクティブセッションがあり、正常にrevokeできる場合は成功", async () => {
			const session: AuthSession = {
				id: "s1",
				userId: "u4",
				firebaseUid: "f4",
				tokenHash: "token",
				expiresAt: "2024-01-02T00:00:00Z",
				createdAt: "2024-01-01T00:00:00Z",
				revokedAt: undefined,
			};
			authSessionRepo.findByFirebaseUidActiveSession.mockResolvedValue(session);
			authSessionRepo.update.mockResolvedValue({
				...session,
				revokedAt: "now",
			});
			const authUser: AuthenticatedUser = {
				id: "u4",
				firebaseUid: "f4",
				githubUsername: "baz2",
				githubDisplayName: "Baz2",
				email: "baz2@example.com",
				avatarUrl: "http://example.com/avatar.png",
			};
			const result = await service.logoutUser(authUser);
			expect(result.success).toBe(true);
		});
		it("アクティブセッションがあり、revoke失敗時は失敗", async () => {
			const session: AuthSession = {
				id: "s2",
				userId: "u5",
				firebaseUid: "f5",
				tokenHash: "token",
				expiresAt: "2024-01-02T00:00:00Z",
				createdAt: "2024-01-01T00:00:00Z",
				revokedAt: undefined,
			};
			authSessionRepo.findByFirebaseUidActiveSession.mockResolvedValue(session);
			authSessionRepo.update.mockResolvedValue(null);
			const authUser: AuthenticatedUser = {
				id: "u5",
				firebaseUid: "f5",
				githubUsername: "baz3",
				githubDisplayName: "Baz3",
				email: "baz3@example.com",
				avatarUrl: "http://example.com/avatar.png",
			};
			const result = await service.logoutUser(authUser);
			expect(result.success).toBe(false);
		});
	});

	describe("getFavoriteRepositories", () => {
		it("favoriteRepositoryRepo.findByUserIdに正しい引数が渡る", async () => {
			const userId = "user-uuid-1";
			const options = { limit: 10, offset: 5 };
			favoriteRepositoryRepo.findByUserId = jest
				.fn()
				.mockResolvedValue({ favorites: [], total: 0 });
			await service.getFavoriteRepositories(userId, options);
			expect(favoriteRepositoryRepo.findByUserId).toHaveBeenCalledWith(
				userId,
				options,
			);
		});

		it("favoriteRepositoryRepoの返却値をそのまま返す", async () => {
			const userId = "user-uuid-1";
			const options = { limit: 10, offset: 0 };
			const mockFavoriteRepo = {
				id: "fav-uuid-1",
				userId: "user-uuid-1",
				githubRepoId: 12345,
				repositoryFullName: "owner/repo-1",
				owner: "owner",
				repo: "repo-1",
				registeredAt: new Date().toISOString(),
			};
			favoriteRepositoryRepo.findByUserId = jest
				.fn()
				.mockResolvedValue({ favorites: [mockFavoriteRepo], total: 1 });
			const result = await service.getFavoriteRepositories(userId, options);
			expect(result).toEqual({ favorites: [mockFavoriteRepo], total: 1 });
		});
	});

	describe("deleteFavoriteRepository", () => {
		const userId = "user-uuid-1";
		const anotherUserId = "user-uuid-2";
		const favoriteId = "fav-uuid-1";

		const mockFavorite = {
			id: favoriteId,
			userId: userId, // このお気に入りは userId の所有物
			githubRepoId: 1,
			repositoryFullName: "owner/repo",
			owner: "owner",
			repo: "repo",
			registeredAt: "2024-01-01T00:00:00Z",
		};

		it("正常系: 所有者のお気に入りを正常に削除できる", async () => {
			// 1. findByIdで、所有者本人のお気に入りを返すようにモックを設定
			favoriteRepositoryRepo.findById.mockResolvedValue(mockFavorite);
			// 2. delete処理は成功（true）を返すように設定
			favoriteRepositoryRepo.delete.mockResolvedValue(true);

			const result = await service.deleteFavoriteRepository(userId, favoriteId);

			// 期待通り、リポジトリのdeleteメソッドが正しいIDで呼ばれたか確認
			expect(favoriteRepositoryRepo.delete).toHaveBeenCalledWith(favoriteId);
			// サービスが成功オブジェクトを返したか確認
			expect(result).toEqual({ success: true });
		});

		it("異常系: 所有者でない場合はFORBIDDENエラーを返す", async () => {
			favoriteRepositoryRepo.findById.mockResolvedValue(mockFavorite);

			await expect(
				service.deleteFavoriteRepository(anotherUserId, favoriteId),
			).rejects.toThrow("Forbidden to delete this favorite repository");

			expect(favoriteRepositoryRepo.delete).not.toHaveBeenCalled();
		});

		it("異常系: 削除対象のお気に入りが存在しない場合はNOT_FOUNDエラーを返す", async () => {
			favoriteRepositoryRepo.findById.mockResolvedValue(null);

			await expect(
				service.deleteFavoriteRepository(userId, favoriteId),
			).rejects.toThrow("Favorite repository not found");

			expect(favoriteRepositoryRepo.delete).not.toHaveBeenCalled();
		});

		it("異常系: DBからの削除に失敗した場合はNOT_FOUNDエラーを返す", async () => {
			favoriteRepositoryRepo.findById.mockResolvedValue(mockFavorite);
			favoriteRepositoryRepo.delete.mockResolvedValue(false);

			await expect(
				service.deleteFavoriteRepository(userId, favoriteId),
			).rejects.toThrow("Favorite repository not found");
		});
	});

	describe("registerFavoriteRepository", () => {
		const authUser: AuthenticatedUser = {
			id: "u1",
			firebaseUid: "f1",
			githubUsername: "testuser",
		};
		it("異常系: GitHubリポジトリが見つからない場合、NotFoundErrorをスローする", async () => {
			userRepo.findById.mockResolvedValue({
				id: authUser.id,
				encryptedGitHubAccessToken: "valid-encrypted-token",
			} as User | null);
			(decrypt as jest.Mock).mockReturnValue("decrypted-token");
			githubPort.getRepositoryByOwnerAndRepo.mockRejectedValue(
				new NotFoundError(
					"GITHUB_REPO_NOT_FOUND",
					"GitHub repository not found",
				),
			);
			await expect(
				service.registerFavoriteRepository(authUser, "unknown", "repo"),
			).rejects.toThrow(NotFoundError);
			expect(favoriteRepositoryRepo.save).not.toHaveBeenCalled();
		});
	});
});
