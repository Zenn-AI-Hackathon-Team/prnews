import type { User } from "@prnews/common";
import type { Dependencies } from "../../config/di";
export type AuthenticatedUser = Pick<User, "id" | "githubUsername"> & {
    firebaseUid: string;
    githubDisplayName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
};
export type AuthVariables = {
    user?: AuthenticatedUser;
};
export declare const authMiddleware: import("hono").MiddlewareHandler<{
    Variables: Dependencies & AuthVariables;
}, string, {}>;
