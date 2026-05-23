/**
 * db-admin.mjs
 * Low-level SQL execution helpers for server scripts.
 * Uses Supabase Management API — no direct TCP connection needed.
 * Server-only — never import from app code.
 */

import { readFileSync } from 'fs';
import { executeSQL } from './supabase-db-url.mjs';

export { executeSQL };

/**
 * Execute a SQL file via the Management API.
 * Splits on semicolons at statement boundaries and runs each statement.
 * Returns array of results (one per statement).
 */
export async function executeSQLFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const results = [];
  const errors = [];

  // Split into individual statements — split on semicolons that end a line
  // (handles DO $$ blocks, functions, etc. by sending the whole file at once)
  // For Supabase Management API, send the whole file as one query.
  try {
    const result = await executeSQL(raw);
    results.push({ file: filePath, ok: true, rows: result.rows });
  } catch (e) {
    errors.push({ file: filePath, ok: false, error: e.message });
  }

  return { results, errors };
}
