import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { type Dependencies, buildDependencies } from "./config/di";
import {
	type AuthVariables,
	authMiddleware,
} from "./presentation/middlewares/authMiddleware";
import generalRoutes from "./presentation/routes/generalRoutes";
import prRoutes from "./presentation/routes/prRoutes";
import rankingRoutes from "./presentation/routes/rankingRoutes";
import userRoutes from "./presentation/routes/userRoutes";

const app = new OpenAPIHono<{ Variables: Dependencies & AuthVariables }>({
	defaultHook: (result, c) => {
		if (!result.success) {
			throw new HTTPException(422, {
				message: "Validation Failed",
				cause: result.error,
			});
		}
	},
});

app.use("*", async (c, next) => {
	const deps = buildDependencies();
	c.set("github", deps.github);
	c.set("gemini", deps.gemini);
	c.set("prRepo", deps.prRepo);
	c.set("userRepo", deps.userRepo);
	c.set("authSessionRepo", deps.authSessionRepo);
	c.set("generalService", deps.generalService);
	c.set("prService", deps.prService);
	c.set("userService", deps.userService);
	c.set("rankingService", deps.rankingService);
	c.set("auth", deps.auth);
	await next();
});

// app.use("/repos/*", authMiddleware);
// app.use("/repos/:owner/:repo/pulls/*", authMiddleware);
app.use("/users/*", authMiddleware);
app.use("/auth/*", (c, next) => {
	if (c.req.path === "/auth/signup") return next();
	return authMiddleware(c, next);
});
// app.use("/articles/*", authMiddleware);

app.route("/", generalRoutes);
app.route("/", prRoutes);
app.route("/", userRoutes);
app.route("/", rankingRoutes);

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "Firebase IDトークンを Bearer トークンとして指定します。",
});

app.doc("/specification", {
	openapi: "3.0.3",
	info: {
		version: "1.0.0",
		title: "PR News Backend API",
	},
	security: [
		{
			bearerAuth: [],
		},
	],
});

app.get("/doc", swaggerUI({ url: "/specification" }));

// グローバルエラーハンドラ
app.onError((err, c) => {
	if (err instanceof HTTPException) {
		if (err.cause instanceof ZodError) {
			const details = err.cause.errors.map((e) => ({
				path: e.path,
				message: e.message,
			}));
			return c.json(
				{ code: "VALIDATION_ERROR", message: err.message, details },
				err.status,
			);
		}
		return c.json({ code: "HTTP_EXCEPTION", message: err.message }, err.status);
	}
	console.error("[UnhandledError]", err);
	return c.json(
		{ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
		500,
	);
});

serve(
	{
		fetch: app.fetch,
		port: 8080,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
