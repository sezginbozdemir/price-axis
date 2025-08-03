import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { resolveEnvs } from "@repo/env";

resolveEnvs();

export const env = createEnv({
  server: {
    NODE_ENV: z.string(),
    SERVER_PORT: z.string(),
  },
  runtimeEnv: process.env,
});
