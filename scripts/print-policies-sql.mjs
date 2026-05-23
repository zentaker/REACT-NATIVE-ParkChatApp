#!/usr/bin/env node
/**
 * print-policies-sql.mjs
 * Prints the corrected policies.sql to stdout, ready to paste into
 * the Supabase Dashboard SQL Editor.
 *
 * Usage:  node scripts/print-policies-sql.mjs
 *    or:  npm run supabase:policies
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'supabase', 'policies.sql'), 'utf8');

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  Aldea / ParkChat — Apply RLS Policies to Supabase           ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log('║  Steps:                                                       ║');
console.log('║  1. Open https://supabase.com/dashboard                       ║');
console.log('║  2. Select your project (apcdhwqfntujcwsbtfbu)               ║');
console.log('║  3. Go to  SQL Editor  (left sidebar)                         ║');
console.log('║  4. Create a new query  →  paste the SQL below  →  RUN       ║');
console.log('║  5. Then run:  npm run qa:smoke                               ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log('─── BEGIN SQL (copy everything between these lines) ────────────');
console.log(sql);
console.log('─── END SQL ────────────────────────────────────────────────────');
console.log('');
