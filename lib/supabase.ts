import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

function isValidSupabaseUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    const isHttps = parsed.protocol === "https:";
    const isLocalHttp =
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

    if (!isHttps && !isLocalHttp) return false;

    if (isHttps) {
      const isSupabaseHost =
        parsed.hostname.endsWith(".supabase.co") ||
        parsed.hostname.endsWith(".supabase.in");
      if (!isSupabaseHost) return false;
    }

    return true;
  } catch {
    return false;
  }
}

const hasValidUrl = isValidSupabaseUrl(supabaseUrl);
const hasAnonKey = Boolean(supabaseAnonKey);

export const isSupabaseConfigured = hasValidUrl && hasAnonKey;

if (!isSupabaseConfigured && (supabaseUrl || supabaseAnonKey)) {
  console.warn(
    `[supabase] Fallback to mocks. URL valid: ${hasValidUrl}, anon key set: ${hasAnonKey}. ` +
      `EXPO_PUBLIC_SUPABASE_URL must be https://<project>.supabase.co (or http://localhost for dev).`
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null;
