import { Octokit } from "@octokit/rest";
import { HTTPException } from "hono/http-exception";
import type { PullRequest } from "../../domain/pullRequest";
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
			throw new HTTPException(500, { message: "Internal server error" });
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
				throw new HTTPException(404, { message: "Repository not found" });
			}
			throw new HTTPException(500, { message: "Internal server error" });
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
			throw new HTTPException(500, { message: "Internal server error" });
		}
	},
	async listPullRequests(accessToken, owner, repo, options) {
		const octokit = getOctokit(accessToken);
		try {
			const response = await octokit.pulls.list({
				owner,
				repo,
				state: options.state,
				per_page: options.per_page,
				page: options.page,
			});
			return response.data;
		} catch (error) {
			if (
				error &&
				typeof error === "object" &&
				"status" in error &&
				error.status === 404
			) {
				console.warn(`[githubClient] Repository not found: ${owner}/${repo}`);
				throw new HTTPException(404, { message: "Repository not found" });
			}
			console.error("[githubClient] Failed to list pull requests:", error);
			throw new HTTPException(500, { message: "Internal server error" });
		}
	},
	async listIssues(accessToken, owner, repo, options) {
		const octokit = getOctokit(accessToken);
		try {
			const response = await octokit.issues.listForRepo({
				owner,
				repo,
				state: options.state,
				per_page: options.per_page,
				page: options.page,
			});

			// PRを除外
			const issuesOnly = response.data.filter((issue) => !issue.pull_request);

			// 必要なプロパティのみ返す
			return issuesOnly.map((issue) => ({
				number: issue.number,
				title: issue.title,
				html_url: issue.html_url,
				state: issue.state,
				created_at: issue.created_at,
				user: issue.user ? { login: issue.user.login } : null,
			}));
		} catch (error) {
			if (
				error &&
				typeof error === "object" &&
				"status" in error &&
				error.status === 404
			) {
				console.warn(
					`[githubClient] Repository not found for listing issues: ${owner}/${repo}`,
				);
				throw new HTTPException(404, { message: "Repository not found" });
			}
			console.error("[githubClient] Failed to list issues:", error);
			throw new HTTPException(500, { message: "Internal server error" });
		}
	},
	async fetchIssue(accessToken, owner, repo, issueNumber) {
		const octokit = getOctokit(accessToken);
		try {
			const { data: issueData } = await octokit.issues.get({
				owner,
				repo,
				issue_number: issueNumber,
			});
			const { data: commentsData } = await octokit.issues.listComments({
				owner,
				repo,
				issue_number: issueNumber,
			});
			const issue = {
				issueNumber: issueData.number,
				repositoryFullName: `${owner}/${repo}`,
				githubIssueUrl: issueData.html_url,
				title: issueData.title,
				body: issueData.body ?? null,
				author: issueData.user
					? {
							login: issueData.user.login,
							avatar_url: issueData.user.avatar_url,
							html_url: issueData.user.html_url,
						}
					: { login: "", avatar_url: "", html_url: "" },
				state: issueData.state as "open" | "closed",
				labels: issueData.labels.map((label) =>
					typeof label === "string"
						? { name: label, color: "ffffff", description: null }
						: {
								name: label.name ?? "unknown label",
								color: label.color ?? "ffffff",
								description: label.description ?? null,
							},
				),
				assignee: issueData.assignee
					? {
							login: issueData.assignee.login,
							avatar_url: issueData.assignee.avatar_url,
							html_url: issueData.assignee.html_url,
						}
					: null,
				assignees:
					issueData.assignees?.map((user) => ({
						login: user.login,
						avatar_url: user.avatar_url,
						html_url: user.html_url,
					})) ?? null,
				milestone: issueData.milestone
					? {
							title: issueData.milestone.title,
							state: issueData.milestone.state,
						}
					: null,
				comments: commentsData.map((comment) => ({
					author: comment.user
						? {
								login: comment.user.login,
								avatar_url: comment.user.avatar_url,
								html_url: comment.user.html_url,
							}
						: null,
					body: comment.body ?? "",
					createdAt: comment.created_at,
				})),
				githubIssueCreatedAt: issueData.created_at,
				githubIssueUpdatedAt: issueData.updated_at,
			};
			return issue;
		} catch (error) {
			if (
				typeof error === "object" &&
				error !== null &&
				"status" in error &&
				error.status === 404
			) {
				return null;
			}
			console.error("Failed to fetch issue from GitHub:", error);
			throw new HTTPException(500, {
				message: "Failed to fetch issue from GitHub",
			});
		}
	},
});
