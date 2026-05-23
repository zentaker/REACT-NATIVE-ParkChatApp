/**
 * supabase-db-url.mjs
 * Builds Supabase connection config from environment secrets.
 * Server-only — never import from app code.
 *
 * SECURITY CONTRACT:
 * - Never print the full connection string.
 * - Never print the password.
 * - Never expose via EXPO_PUBLIC_ variables.
 */

export function getProjectRef() {
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;
  if (!url) throw new Error('No Supabase URL env var found (EXPO_PUBLIC_SUPABASE_URL).');
  const match = url.match(/https:\/\/([^.]+)\./);
  if (!match) throw new Error('Cannot extract project ref from Supabase URL: ' + url);
  return match[1];
}

/**
 * Returns a pg-compatible config object (no password printed).
 * Uses the Supabase Management API /database/query endpoint for DDL.
 * Direct TCP connections from Replit are blocked by IPv6-only routing.
 */
export function getManagementApiConfig() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN not set. Add it via Replit Secrets.');
  const ref = getProjectRef();
  return {
    ref,
    baseUrl: 'https://api.supabase.com/v1/projects/' + ref,
    token,
  };
}

/**
 * Executes SQL via the Supabase Management API.
 * Returns { rows } on success, throws on error.
 * Never prints the token or password.
 */
export async function executeSQL(sql) {
  const { baseUrl, token } = getManagementApiConfig();
  const res = await fetch(baseUrl + '/database/query', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.json();
  if (!res.ok) {
    const msg = body?.message || body?.error || JSON.stringify(body).slice(0, 200);
    throw new Error('SQL execution failed (' + res.status + '): ' + msg);
  }
  return { rows: Array.isArray(body) ? body : [body] };
}
