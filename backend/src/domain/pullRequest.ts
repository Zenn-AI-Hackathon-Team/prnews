export type Comment = {
	author: string;
	body: string;
	createdAt: string;
};

export type PullRequest = {
	id: string;
	prNumber: number;
	repository: string;
	title: string;
	body: string | null;
	diff: string;
	authorLogin: string;
	createdAt: string;
	comments: Comment[];
};

export const createPullRequest = (props: PullRequest): PullRequest => ({
	...props,
});
