import { z } from "zod";
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    firebaseUid: z.ZodString;
    githubUserId: z.ZodNumber;
    githubUsername: z.ZodString;
    githubDisplayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    language: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    firebaseUid: string;
    githubUserId: number;
    githubUsername: string;
    language: string;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    githubDisplayName?: string | null | undefined;
    email?: string | null | undefined;
    avatarUrl?: string | null | undefined;
}, {
    id: string;
    firebaseUid: string;
    githubUserId: number;
    githubUsername: string;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    githubDisplayName?: string | null | undefined;
    email?: string | null | undefined;
    avatarUrl?: string | null | undefined;
    language?: string | undefined;
}>;
export type User = z.infer<typeof userSchema>;
