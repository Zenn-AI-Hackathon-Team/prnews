import { Octokit } from "@octokit/rest";
import { ErrorCode } from "@prnews/common";
import type { PullRequest } from "../../domain/pullRequest";
import type { RepositoryInfo } from "../../domain/repository";
import type { GithubPort } from "../../ports/githubPort";

const getOctokit = (accessToken: string) => new Octokit({ auth: accessToken });

export const githubClient = (): GithubPort => ({
	async fetchPullRequest(accessToken, owner, repo, number) {
		const octokit = getOctokit(accessToken);
		try {
			const { data: prData } = await octokit.pulls.get({
				owner,
				repo,
				pull_number: number,
			});

			const diffResponse = await octokit.pulls.get({
				owner,
				repo,
				pull_number: number,
				headers: {
					Accept: "application/vnd.github.v3.diff",
				},
			});
			const diff = String(diffResponse.data);

			// 4. Issue形式のコメントを取得
			const { data: issueComments } = await octokit.issues.listComments({
				owner,
				repo,
				issue_number: number,
			});

			// 5. レビューコメントを取得
			const { data: reviewComments } = await octokit.pulls.listReviewComments({
				owner,
				repo,
				pull_number: number,
			});

			// 6. 取得したコメントを整形・結合して時系列にソート
			const allComments = [
				...issueComments.map((c) => ({
					author: c.user?.login || "unknown",
					body: c.body || "",
					createdAt: c.created_at,
				})),
				...reviewComments.map((c) => ({
					author: c.user?.login || "unknown",
					body: c.body,
					createdAt: c.created_at,
				})),
			].sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			);

			const pr: PullRequest = {
				id: String(prData.id),
				prNumber: prData.number,
				repository: prData.base.repo.full_name,
				title: prData.title,
				body: prData.body,
				diff,
				authorLogin: prData.user?.login || "",
				createdAt: prData.created_at,
				comments: allComments,
			};
			return pr;
		} catch (error: unknown) {
			if (
				typeof error === "object" &&
				error !== null &&
				"status" in error &&
				(error as { status: number }).status === 404
			) {
				return null;
			}
			throw error;
		}
	},
	async getRepositoryByOwnerAndRepo(accessToken, owner, repo) {
		const octokit = getOctokit(accessToken);
		try {
			const { data } = await octokit.repos.get({ owner, repo });
			return {
				githubRepoId: data.id,
				repositoryFullName: data.full_name,
				owner: data.owner.login,
				repo: data.name,
			};
		} catch (error: unknown) {
			console.error(`Failed to fetch repository ${owner}/${repo}`, error);
			if (
				typeof error === "object" &&
				error !== null &&
				"status" in error &&
				typeof (error as { status?: unknown }).status === "number" &&
				(error as { status: number }).status === 404
			) {
				throw new Error(ErrorCode.GITHUB_REPO_NOT_FOUND);
			}
			throw new Error(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	},
	async getAuthenticatedUserInfo(accessToken) {
		const octokit = getOctokit(accessToken);
		try {
			const { data } = await octokit.users.getAuthenticated();
			return {
				id: data.id,
				login: data.login,
				name: data.name ?? null,
				email: data.email ?? null,
				avatar_url: data.avatar_url ?? null,
			};
		} catch (error) {
			console.error("Failed to fetch authenticated GitHub user info", error);
			throw new Error(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	},
});
