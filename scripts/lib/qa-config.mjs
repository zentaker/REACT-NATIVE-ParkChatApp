/**
 * qa-config.mjs
 * Centralised QA credential config for all QA scripts.
 *
 * Priority order:
 *   1. Environment variables (set via Replit Secrets or CI)
 *   2. Fallback to known test-only QA accounts (non-privileged, QA DB only)
 *
 * SECURITY:
 * - Never import this file from app/, components/, services/, lib/, hooks/
 * - Never log or print the password values
 * - These are non-privileged QA accounts, not production or admin credentials
 * - The fallback values are QA-only accounts with no special access
 */

export const QA_USER_A_EMAIL =
  process.env.QA_USER_A_EMAIL ?? 'qa.aldea.a@example.com';

export const QA_USER_A_PASSWORD =
  process.env.QA_USER_A_PASSWORD ?? 'Ald3aQA!2026';

export const QA_USER_B_EMAIL =
  process.env.QA_USER_B_EMAIL ?? 'qa.aldea.b@example.com';

export const QA_USER_B_PASSWORD =
  process.env.QA_USER_B_PASSWORD ?? 'Ald3aQA!2026';
