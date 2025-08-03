import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { resolveEnvs } from "@repo/env";

resolveEnvs();

export const env = createEnv({
  server: {
    SUPABASE_URL: z.string(),
    SUPABASE_ANON_KEY: z.string(),
    DATABASE_URL: z.string(),
  },
  runtimeEnv: process.env,
});
