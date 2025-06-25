import { OpenAPIHono } from "@hono/zod-openapi";
import type { Dependencies } from "../config/di";
import type { AuthVariables } from "./middlewares/authMiddleware";
export declare const createApp: <T extends object = Dependencies & AuthVariables>() => OpenAPIHono<{
    Variables: T;
}, {}, "/">;
