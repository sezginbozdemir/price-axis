import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@repo/env";
import { Pool, type ClientConfig } from "pg";
import * as schema from "./schema/index";

const config: ClientConfig = {
  connectionString: env.DATABASE_URL,
};

export const pool = new Pool(config);

export const db = drizzle(pool, { schema });

export type { PgColumn, PgTable, IndexColumn } from "drizzle-orm/pg-core";
export * from "drizzle-orm";
export * from "./schema";
