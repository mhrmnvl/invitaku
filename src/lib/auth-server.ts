import { getCookie } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL : undefined) ||
  "";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_ANON_KEY : undefined) ||
  "";

/**
 * Creates an authenticated Supabase client on the server by extracting the
 * access token from the request cookie.
 */
export function getSupabaseServerClient() {
  const token = getCookie("sb-access-token");

  const options: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };

  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  const client = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-key",
    options,
  );

  return client;
}

/**
 * Validates the current server session and returns the logged in User object,
 * or throws an error if unauthenticated.
 */
export async function requireUserSession() {
  const token = getCookie("sb-access-token");
  console.log(
    "[Server Auth] sb-access-token cookie:",
    token ? `${token.substring(0, 15)}...` : "MISSING",
  );
  if (!token) {
    throw new Error("Sesi login berakhir atau tidak valid. Silakan masuk kembali.");
  }
  const client = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);
  if (error || !user) {
    console.error(
      "[Server Auth] getUser verification failed:",
      error?.message || "No user returned",
    );
    throw new Error("Sesi login berakhir atau tidak valid. Silakan masuk kembali.");
  }
  return user;
}

/**
 * Helper to fetch optional user session (returns null instead of throwing)
 */
export async function getUserSession() {
  try {
    return await requireUserSession();
  } catch {
    return null;
  }
}
