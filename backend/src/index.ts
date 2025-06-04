import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { type Dependencies, buildDependencies } from "./config/di";
import {
	type AuthVariables,
	authMiddleware,
} from "./presentation/middlewares/authMiddleware";
import generalRoutes from "./presentation/routes/generalRoutes";
import prRoutes from "./presentation/routes/prRoutes";
import userRoutes from "./presentation/routes/userRoutes";

const app = new Hono<{ Variables: Dependencies & AuthVariables }>();

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
	await next();
});

app.use("/repos/*", authMiddleware);
app.use("/users/*", authMiddleware);
app.use("/auth/*", authMiddleware);

app.route("/", generalRoutes);
app.route("/", prRoutes);
app.route("/", userRoutes);

serve(
	{
		fetch: app.fetch,
		port: 8080,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
