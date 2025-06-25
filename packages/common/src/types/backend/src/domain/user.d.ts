export type User = {
    id: string;
    githubUserId: number;
    githubUsername: string;
    language: string;
    firebaseUid: string;
    githubDisplayName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
    encryptedGitHubAccessToken?: string;
};
export declare const createUser: (props: User) => User;
