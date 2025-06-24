import { z } from "zod";
export declare const authSessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    firebaseUid: z.ZodString;
    tokenHash: z.ZodString;
    expiresAt: z.ZodString;
    createdAt: z.ZodString;
    revokedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    id: string;
    firebaseUid: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    revokedAt?: string | null | undefined;
}, {
    createdAt: string;
    id: string;
    firebaseUid: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    revokedAt?: string | null | undefined;
}>;
export type AuthSession = z.infer<typeof authSessionSchema>;
