/**
 * supabase-admin.mjs
 * Server-only Supabase admin client using service_role key.
 *
 * SECURITY CONTRACT:
 * - Only import this file from scripts/*.mjs
 * - Never import from app/, components/, lib/, hooks/, services/
 * - Never pass createAdminClient() result to client-side code
 * - Never log the client's auth headers
 */

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

function getSupabaseUrl() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
    || process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;
  if (!url) throw new Error('No Supabase URL env var found.');
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('.supabase.co') && !parsed.hostname.endsWith('.supabase.in')) {
      throw new Error('URL does not look like a Supabase project: ' + parsed.hostname);
    }
    return url;
  } catch (e) {
    throw new Error('Invalid Supabase URL: ' + e.message);
  }
}

function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment.');
  if (!key.startsWith('eyJ')) throw new Error('SUPABASE_SERVICE_ROLE_KEY does not look like a JWT.');
  return key;
}

/**
 * Returns a Supabase client with service_role privileges.
 * Use only for admin operations in QA scripts.
 */
export function createAdminClient() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  });
}

/**
 * Returns a Supabase client with anon key (same as frontend).
 * Use for RLS testing — simulates the real app.
 */
export function createAnonClient() {
  const url = getSupabaseUrl();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY not found.');
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  });
}

/**
 * Returns a Supabase client authenticated as a specific user.
 * Used for RLS testing with real user JWTs.
 */
export function createUserClient(accessToken) {
  const url = getSupabaseUrl();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY not found.');
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  });
  client.auth.setSession({ access_token: accessToken, refresh_token: '' });
  return client;
}
