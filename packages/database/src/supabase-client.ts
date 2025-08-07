import { createClient } from "@supabase/supabase-js";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createSupabaseClient(url: string, anonKey: string) {
  return createClient<Database>(url, anonKey);
}
export function createBrowserSupabase(url: string, anonKey: string) {
  return createBrowserClient<Database>(url, anonKey);
}

export async function createServerSupabase(
  url: string,
  anonKey: string,
  cookies: any,
) {
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
