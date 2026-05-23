#!/usr/bin/env node
/**
 * doctor-db-url.mjs
 * Validates that Supabase DB automation secrets are correctly configured.
 * Does NOT print passwords, tokens, or connection strings.
 *
 * Usage: npm run supabase:doctor-db
 */

import { getProjectRef, getManagementApiConfig, executeSQL } from './lib/supabase-db-url.mjs';

let ok = 0;
let fail = 0;

function check(label, pass, detail) {
  if (pass) {
    console.log('[OK]  ' + label + (detail ? ' — ' + detail : ''));
    ok++;
  } else {
    console.log('[FAIL] ' + label + (detail ? ' — ' + detail : ''));
    fail++;
  }
}

function warn(label, detail) {
  console.log('[WARN] ' + label + (detail ? ' — ' + detail : ''));
}

async function run() {
  console.log('Aldea / ParkChat — Supabase DB Doctor');
  console.log('======================================');

  // 1. SUPABASE_DB_PASSWORD
  const dbpw = process.env.SUPABASE_DB_PASSWORD;
  check('SUPABASE_DB_PASSWORD exists', Boolean(dbpw));
  if (dbpw) check('SUPABASE_DB_PASSWORD length reasonable', dbpw.length >= 6, 'len=' + dbpw.length);

  // 2. SUPABASE_ACCESS_TOKEN
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  check('SUPABASE_ACCESS_TOKEN exists', Boolean(token));
  if (token) check('SUPABASE_ACCESS_TOKEN length reasonable', token.length >= 20, 'len=' + token.length);

  // 3. Supabase URL
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;
  check('Supabase URL env var exists', Boolean(url));

  let ref;
  try {
    ref = getProjectRef();
    check('Project ref extractable from URL', true, 'ref=' + ref);
  } catch (e) {
    check('Project ref extractable from URL', false, e.message);
  }

  // 4. Security: ensure no EXPO_PUBLIC_ secrets
  const pubPw = process.env.EXPO_PUBLIC_SUPABASE_DB_PASSWORD;
  const pubUrl = process.env.EXPO_PUBLIC_SUPABASE_DB_URL;
  check('No EXPO_PUBLIC_SUPABASE_DB_PASSWORD', !pubPw, pubPw ? 'FOUND — REMOVE IMMEDIATELY' : 'not set (correct)');
  check('No EXPO_PUBLIC_SUPABASE_DB_URL', !pubUrl, pubUrl ? 'FOUND — REMOVE IMMEDIATELY' : 'not set (correct)');

  // 5. Management API connectivity
  if (token && ref) {
    try {
      const res = await fetch('https://api.supabase.com/v1/projects/' + ref, {
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const d = await res.json();
        check('Management API accessible', true, 'project=' + d.name + ' region=' + d.region);
      } else {
        const d = await res.json();
        check('Management API accessible', false, 'HTTP ' + res.status + ': ' + (d.message || '').slice(0, 60));
      }
    } catch (e) {
      check('Management API accessible', false, e.message);
    }

    // 6. SQL execution test
    try {
      const r = await executeSQL('SELECT current_database() as db, current_user as usr');
      check('SQL execution via Management API', true, 'db=' + r.rows[0].db + ' user=' + r.rows[0].usr);
    } catch (e) {
      check('SQL execution via Management API', false, e.message.slice(0, 100));
    }
  } else {
    warn('Skipping API tests', 'token or ref missing');
  }

  // 7. Summary
  console.log('\n--- SUMMARY ---');
  console.log('OK:   ' + ok);
  console.log('FAIL: ' + fail);
  if (fail > 0) {
    console.log('\n[FAIL] Doctor found issues. Fix before running supabase:apply:* scripts.');
    process.exit(1);
  }
  console.log('\n[OK]  All checks passed. Ready to run supabase:apply:policies and qa:smoke.');
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
