import type { AppType } from "@prnews/backend/rpc";
import { hc } from "hono/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const client = hc<AppType>(apiUrl);
