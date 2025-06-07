import { ErrorCode } from "@prnews/common";
import type { AuthSession } from "../domain/authSession";
import type { User } from "../domain/user";
import type { AuthSessionRepoPort } from "../ports/authSessionRepoPort";
import type { FavoriteRepositoryRepoPort } from "../ports/favoriteRepositoryRepoPort";
import type { GithubPort } from "../ports/githubPort";
import type { UserRepoPort } from "../ports/userRepoPort";
import type { AuthenticatedUser } from "../presentation/middlewares/authMiddleware";
import { createUserService } from "./userService";

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
			userRepo.findByFirebaseUid.mockResolvedValue(null);
			userRepo.save.mockImplementation(async (u: User) => u);
			const authUser: AuthenticatedUser = {
				id: "u2",
				firebaseUid: "f2",
				githubUsername: "bar",
				githubDisplayName: "Bar",
				email: "bar@example.com",
				avatarUrl: "http://example.com/avatar.png",
			};
			const result = await service.createUser(authUser, "en");
			expect(result).toMatchObject({
				githubUsername: "bar",
				language: "en",
				firebaseUid: "f2",
			});
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
			// 1. findByIdではお気に入りは見つかるが...
			favoriteRepositoryRepo.findById.mockResolvedValue(mockFavorite);

			// 2. 別のユーザーIDで削除しようとする
			const result = await service.deleteFavoriteRepository(
				anotherUserId,
				favoriteId,
			);

			// 3. 所有者ではないので、deleteは呼ばれずにFORBIDDENエラーが返ることを確認
			expect(favoriteRepositoryRepo.delete).not.toHaveBeenCalled();
			expect(result).toEqual({ success: false, error: "FORBIDDEN" });
		});

		it("異常系: 削除対象のお気に入りが存在しない場合はNOT_FOUNDエラーを返す", async () => {
			// 1. findByIdがお気に入りを見つけられない（nullを返す）ように設定
			favoriteRepositoryRepo.findById.mockResolvedValue(null);

			const result = await service.deleteFavoriteRepository(userId, favoriteId);

			// 2. deleteは呼ばれずにNOT_FOUNDエラーが返ることを確認
			expect(favoriteRepositoryRepo.delete).not.toHaveBeenCalled();
			expect(result).toEqual({ success: false, error: "NOT_FOUND" });
		});

		it("異常系: DBからの削除に失敗した場合はNOT_FOUNDエラーを返す", async () => {
			// 1. findByIdでは見つかる
			favoriteRepositoryRepo.findById.mockResolvedValue(mockFavorite);
			// 2. しかし、delete処理自体が失敗（falseを返す）するように設定
			favoriteRepositoryRepo.delete.mockResolvedValue(false);

			const result = await service.deleteFavoriteRepository(userId, favoriteId);

			// 3. NOT_FOUNDエラーが返ることを確認
			expect(result).toEqual({ success: false, error: "NOT_FOUND" });
		});
	});
});
