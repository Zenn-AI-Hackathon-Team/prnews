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
});
