import { cookies } from "next/headers";
import { env } from "../env";
import { createServerSupabase } from "@repo/database";

export async function getServerSupabase() {
  return await createServerSupabase(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    cookies,
  );
}
