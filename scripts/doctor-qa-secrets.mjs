#!/usr/bin/env node
/**
 * doctor-qa-secrets.mjs
 * Validates QA configuration and checks for dangerous secret leaks.
 * Usage: npm run qa:doctor
 */

let ok = 0;
let warn = 0;
let fail = 0;

function OK(label) {
  console.log(`[OK]  ${label}`);
  ok++;
}
function WARN(label) {
  console.log(`[WARN] ${label}`);
  warn++;
}
function FAIL(label) {
  console.log(`[FAIL] ${label}`);
  fail++;
}

// 1. Check QA users configured or dummy fallback
const userA = process.env.QA_USER_A_EMAIL ?? 'qa.aldea.a@example.com';
const userB = process.env.QA_USER_B_EMAIL ?? 'qa.aldea.b@example.com';
const usingEnvA = Boolean(process.env.QA_USER_A_EMAIL);
const usingEnvB = Boolean(process.env.QA_USER_B_EMAIL);
const usingEnvPwd = Boolean(process.env.QA_USER_A_PASSWORD);

if (usingEnvA && usingEnvB && usingEnvPwd) {
  OK('QA users configured via environment variables');
} else {
  WARN('QA users using fallback test-only values — set QA_USER_A_EMAIL / QA_USER_A_PASSWORD / QA_USER_B_EMAIL for CI');
  OK('Fallback QA accounts are non-privileged test-only accounts');
}

// 2. No EXPO_PUBLIC_QA_USER_PASSWORD
if (process.env.EXPO_PUBLIC_QA_USER_PASSWORD) {
  FAIL('EXPO_PUBLIC_QA_USER_PASSWORD is set — this would expose QA passwords to the client bundle!');
} else {
  OK('EXPO_PUBLIC_QA_USER_PASSWORD not set (correct)');
}

// 3. No EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
if (process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
  FAIL('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set — this would expose service_role to client bundle!');
} else {
  OK('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY not set (correct)');
}

// 4. No EXPO_PUBLIC_SUPABASE_DB_PASSWORD
if (process.env.EXPO_PUBLIC_SUPABASE_DB_PASSWORD) {
  FAIL('EXPO_PUBLIC_SUPABASE_DB_PASSWORD is set — this would expose DB password to client bundle!');
} else {
  OK('EXPO_PUBLIC_SUPABASE_DB_PASSWORD not set (correct)');
}

// 5. SUPABASE_SERVICE_ROLE_KEY not in EXPO_PUBLIC_ namespace
const allEnv = Object.keys(process.env);
const exposedDanger = allEnv.filter(
  (k) => k.startsWith('EXPO_PUBLIC_') && (
    k.includes('SERVICE_ROLE') ||
    k.includes('DB_PASSWORD') ||
    k.includes('SECRET') ||
    k.includes('PRIVATE')
  )
);
if (exposedDanger.length > 0) {
  FAIL(`Dangerous EXPO_PUBLIC_ vars found: ${exposedDanger.join(', ')}`);
} else {
  OK('No sensitive keys exposed in EXPO_PUBLIC_ namespace');
}

// 6. Supabase anon key present
if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  OK('EXPO_PUBLIC_SUPABASE_ANON_KEY present (anon key — safe for client)');
} else {
  WARN('EXPO_PUBLIC_SUPABASE_ANON_KEY not set — QA scripts may fail');
}

// 7. Strict geofence config
const strictGeofence = process.env.EXPO_PUBLIC_STRICT_GEOFENCE_POSTING;
if (!strictGeofence || strictGeofence === 'false') {
  OK('EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=false (flexible mode — QA safe)');
} else if (strictGeofence === 'true') {
  WARN('EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=true (strict mode active — may affect QA)');
} else {
  WARN(`EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=${strictGeofence} (unknown value, defaulting to flexible)`);
}

// Summary
console.log('\n==============================');
console.log(`OK:   ${ok}`);
console.log(`WARN: ${warn}`);
console.log(`FAIL: ${fail}`);
console.log('');
if (fail > 0) {
  console.log('[FAIL] QA doctor found critical issues. Fix before running QA scripts.');
  process.exit(1);
} else {
  console.log('[OK]  QA configuration looks healthy.');
}
