import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { buildDependencies } from "./config/di";
import { createApp } from "./presentation/hono-app";
import { authMiddleware } from "./presentation/middlewares/authMiddleware";
import generalRoutes from "./presentation/routes/generalRoutes";
import issuePrivateRoutes from "./presentation/routes/issuePrivateRoutes";
import issuePublicRoutes from "./presentation/routes/issuePublicRoutes";
import prPrivateRoutes from "./presentation/routes/prPrivateRoutes";
import prPublicRoutes from "./presentation/routes/prPublicRoutes";
import rankingRoutes from "./presentation/routes/rankingRoutes";
import userPrivateRoutes from "./presentation/routes/userPrivateRoutes";
import userPublicRoutes from "./presentation/routes/userPublicRoutes";

const app = createApp();

app.use(
	"*",
	cors({
		origin: ["http://localhost:3000"],
		allowHeaders: ["Authorization", "Content-Type"],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		credentials: true, // Cookieの送受信を許可
	}),
);

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
	c.set("issueRepo", deps.issueRepo);
	c.set("issueService", deps.issueService);
	await next();
});

app.doc("/specification", {
	openapi: "3.0.3",
	info: {
		version: "1.0.0",
		title: "PR News Backend API",
	},
});

app.get("/doc", swaggerUI({ url: "/specification" }));

const api = app
	.route("/", generalRoutes)
	.route("/", rankingRoutes)
	.route("/", issuePublicRoutes)
	.route("/", prPublicRoutes)
	.route("/", userPublicRoutes)
	// .use("/auth/*", authMiddleware)
	// .use("/users/*", authMiddleware)
	// .use("/repos/*", authMiddleware)
	// Issue #3122の影響で、pathを指定すると型推論が効かなくなるので、pathを指定しない
	.use(authMiddleware)
	.route("/", userPrivateRoutes)
	.route("/", issuePrivateRoutes)
	.route("/", prPrivateRoutes);

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "Firebase IDトークンを Bearer トークンとして指定します。",
});

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

export type AppType = typeof api;
