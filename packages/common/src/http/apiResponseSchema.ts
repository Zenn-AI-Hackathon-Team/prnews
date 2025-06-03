import { z } from "zod";
import { ErrorCode } from "./errorCodes";

const successPart = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.literal(true),
		data: dataSchema,
		message: z.string().optional(),
	});

const errorPart = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.enum([...Object.values(ErrorCode)] as [ErrorCode, ...ErrorCode[]]),
		details: z.any().optional(),
	}),
	message: z.string().optional(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.discriminatedUnion("success", [successPart(dataSchema), errorPart]);

export type ApiResponse<T extends z.ZodTypeAny> = z.infer<
	ReturnType<typeof apiResponseSchema<T>>
>;
