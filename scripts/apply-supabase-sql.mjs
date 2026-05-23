#!/usr/bin/env node
/**
 * apply-supabase-sql.mjs
 * Applies SQL files to the Supabase DB via Management API.
 * Uses SUPABASE_ACCESS_TOKEN — never prints the token or password.
 *
 * Usage:
 *   node scripts/apply-supabase-sql.mjs --file supabase/policies.sql
 *   node scripts/apply-supabase-sql.mjs --file supabase/triggers.sql
 *   node scripts/apply-supabase-sql.mjs --file supabase/seed.sql
 *   node scripts/apply-supabase-sql.mjs --all
 *
 * --all runs: triggers.sql → policies.sql → seed.sql
 * schema.sql is excluded from --all (tables already exist in the live DB).
 *
 * SECURITY:
 * - Never prints the access token or DB password.
 * - Never drops tables or deletes data.
 */

import { readFileSync, existsSync } from 'fs';
import { executeSQL } from './lib/supabase-db-url.mjs';

const ALL_FILES = [
  'supabase/triggers.sql',
  'supabase/policies.sql',
  'supabase/seed.sql',
];

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--all')) return { all: true };
  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) return { file: args[fileIdx + 1] };
  return { help: true };
}

async function applyFile(filePath) {
  if (!existsSync(filePath)) {
    console.log('[SKIP] ' + filePath + ' — file not found');
    return { ok: true, skipped: true };
  }

  console.log('\n--- Applying: ' + filePath + ' ---');
  const sql = readFileSync(filePath, 'utf8');

  // Safety guard: refuse to run DROP TABLE or DELETE FROM (except DO blocks we allow)
  const upper = sql.toUpperCase();
  const dangerPatterns = ['DROP TABLE', 'DELETE FROM'];
  for (const pat of dangerPatterns) {
    if (upper.includes(pat)) {
      console.log('[ABORT] ' + filePath + ' contains forbidden pattern: ' + pat);
      console.log('        Remove or comment it out before applying.');
      return { ok: false, error: 'Forbidden SQL pattern: ' + pat };
    }
  }

  try {
    const result = await executeSQL(sql);
    console.log('[OK]  ' + filePath + ' applied successfully (' + (result.rows?.length ?? 0) + ' result rows)');
    if (result.rows && result.rows.length > 0 && result.rows[0] && Object.keys(result.rows[0]).length > 0) {
      console.log('      First row:', JSON.stringify(result.rows[0]).slice(0, 120));
    }
    return { ok: true };
  } catch (e) {
    console.log('[FAIL] ' + filePath + ':');
    console.log('       ' + e.message);
    return { ok: false, error: e.message };
  }
}

async function run() {
  const args = parseArgs();

  if (args.help) {
    console.log('Usage:');
    console.log('  node scripts/apply-supabase-sql.mjs --file supabase/policies.sql');
    console.log('  node scripts/apply-supabase-sql.mjs --all');
    process.exit(0);
  }

  console.log('Aldea / ParkChat — Apply Supabase SQL');
  console.log('======================================');

  const files = args.all ? ALL_FILES : [args.file];
  const results = [];

  for (const f of files) {
    const r = await applyFile(f);
    results.push({ file: f, ...r });
    if (!r.ok && !r.skipped) {
      console.log('\n[FAIL] Stopping at ' + f + ' — fix the error above before continuing.');
      break;
    }
  }

  console.log('\n--- SUMMARY ---');
  for (const r of results) {
    const status = r.skipped ? 'SKIP' : r.ok ? 'OK' : 'FAIL';
    console.log('[' + status + '] ' + r.file + (r.error ? ' — ' + r.error.slice(0, 80) : ''));
  }

  const failed = results.filter(r => !r.ok && !r.skipped);
  if (failed.length > 0) {
    console.log('\n[FAIL] ' + failed.length + ' file(s) failed.');
    process.exit(1);
  }
  console.log('\n[OK]  All SQL applied successfully.');
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
