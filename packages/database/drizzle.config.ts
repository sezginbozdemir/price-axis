import { defineConfig } from "drizzle-kit";
import { env } from "@repo/env";

const nonPoolingUrl = env.DATABASE_URL.replace(":6543", ":5432");

export default defineConfig({
  out: "./migrations",
  schema: "./src/schema/index.ts",
  schemaFilter: ["public"],
  dialect: "postgresql",
  dbCredentials: { url: nonPoolingUrl },
});
