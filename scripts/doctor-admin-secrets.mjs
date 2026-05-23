#!/usr/bin/env node
/**
 * doctor-admin-secrets.mjs
 * Validates SUPABASE_SERVICE_ROLE_KEY without ever printing its value.
 * Server-only. Never import from app/, components/, lib/ or services/.
 */

console.log('Aldea / ParkChat — Admin Secrets Doctor');
console.log('========================================\n');

let ok = true;

// 1. EXPO_PUBLIC version must NOT exist
const pub = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
if (pub) {
  console.log('[CRITICAL] EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set.');
  console.log('           This exposes the service role key to the browser.');
  console.log('           Remove it from Secrets immediately and rotate the key.');
  process.exit(1);
}
console.log('[OK]  EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: absent (correct)');

// 2. Service role key must exist
const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!srk) {
  console.log('[FAIL] SUPABASE_SERVICE_ROLE_KEY: NOT FOUND');
  console.log('       Add it in Replit → Secrets → SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 3. Basic format checks — no value is ever printed
const len = srk.length;
const prefix = srk.slice(0, 10);
const looksLikeJwt = srk.startsWith('eyJ');

if (!looksLikeJwt) {
  console.log('[WARN] SUPABASE_SERVICE_ROLE_KEY does not start with "eyJ" — may not be a valid JWT');
  ok = false;
} else {
  console.log('[OK]  SUPABASE_SERVICE_ROLE_KEY: present, len=' + len + ', prefix=eyJ... (JWT format OK)');
}

if (len < 150) {
  console.log('[WARN] SUPABASE_SERVICE_ROLE_KEY seems short (len=' + len + '). Expected ~219 chars.');
  ok = false;
}

// 4. URL checks
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;
if (!url) {
  console.log('[FAIL] No Supabase URL found (EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PROJECT_URL)');
  ok = false;
} else {
  let parsed;
  try { parsed = new URL(url); } catch { parsed = null; }
  const validHost = parsed && (parsed.hostname.endsWith('.supabase.co') || parsed.hostname.endsWith('.supabase.in'));
  if (!validHost) {
    console.log('[WARN] URL does not look like a Supabase project URL: host=' + (parsed?.hostname ?? url.slice(0, 30)));
    ok = false;
  } else {
    console.log('[OK]  Supabase URL: ' + parsed.hostname);
  }
}

// 5. Anon key check
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!anonKey) {
  console.log('[FAIL] EXPO_PUBLIC_SUPABASE_ANON_KEY: NOT FOUND');
  ok = false;
} else {
  console.log('[OK]  EXPO_PUBLIC_SUPABASE_ANON_KEY: present, len=' + anonKey.length);
}

// 6. Confirm service role and anon key are different
if (srk && anonKey && srk === anonKey) {
  console.log('[CRITICAL] SUPABASE_SERVICE_ROLE_KEY and EXPO_PUBLIC_SUPABASE_ANON_KEY are identical.');
  console.log('           This is wrong. Rotate both keys in Supabase Dashboard.');
  process.exit(1);
}
if (srk && anonKey && srk !== anonKey) {
  console.log('[OK]  service_role key and anon key are distinct (correct)');
}

console.log('');
if (ok) {
  console.log('[OK]  Admin secrets ready for server-side QA scripts.');
} else {
  console.log('[WARN] Some checks failed. Review above before running qa-seed.mjs or qa-smoke.mjs.');
  process.exit(1);
}
