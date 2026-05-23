import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

type UrlValidation =
  | { ok: true }
  | { ok: false; reason: string };

function validateSupabaseUrl(value: string): UrlValidation {
  if (!value) return { ok: false, reason: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return {
      ok: false,
      reason: `not a parseable URL (length=${value.length}, starts with "${value.slice(0, 8)}")`
    };
  }

  const isHttps = parsed.protocol === "https:";
  const isLocalHttp =
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

  if (!isHttps && !isLocalHttp) {
    return { ok: false, reason: `bad protocol "${parsed.protocol}" (expected https:)` };
  }

  if (isHttps) {
    const isSupabaseHost =
      parsed.hostname.endsWith(".supabase.co") ||
      parsed.hostname.endsWith(".supabase.in");
    if (!isSupabaseHost) {
      return {
        ok: false,
        reason: `host "${parsed.hostname}" is not *.supabase.co/.supabase.in`
      };
    }
  }

  if (parsed.pathname && parsed.pathname !== "/" && parsed.pathname !== "") {
    return {
      ok: false,
      reason: `URL must have no path; got "${parsed.pathname}" (remove /rest/v1 etc.)`
    };
  }

  return { ok: true };
}

const urlValidation = validateSupabaseUrl(supabaseUrl);
const hasValidUrl = urlValidation.ok;
const hasAnonKey = Boolean(supabaseAnonKey);

export const isSupabaseConfigured = hasValidUrl && hasAnonKey;

if (!isSupabaseConfigured && (supabaseUrl || supabaseAnonKey)) {
  const reason = urlValidation.ok ? "valid" : urlValidation.reason;
  console.warn(
    `[supabase] Fallback to mocks. URL check: ${reason}. anon key set: ${hasAnonKey}. ` +
      `EXPO_PUBLIC_SUPABASE_URL must be https://<project-ref>.supabase.co with no path.`
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
