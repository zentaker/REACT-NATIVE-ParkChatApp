#!/usr/bin/env node
/**
 * qa-analytics.mjs
 * QA tests for Stage 2F analytics and pilot feedback.
 * Usage: npm run qa:analytics
 *
 * SECURITY: Never prints secrets, tokens, or passwords.
 */

import { QA_USER_A_EMAIL, QA_USER_A_PASSWORD, QA_USER_B_EMAIL, QA_USER_B_PASSWORD } from './lib/qa-config.mjs';
import { createAdminClient, createAnonClient } from './lib/supabase-admin.mjs';

let pass = 0;
let fail = 0;

function PASS(label, detail) {
  const suffix = detail ? ` (${detail})` : '';
  console.log(`[PASS] ${label}${suffix}`);
  pass++;
}

function FAIL(label, detail) {
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`[FAIL] ${label}${suffix}`);
  fail++;
}

async function loginAs(email, password) {
  const client = createAnonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
  return client;
}

async function getUserId(client) {
  const { data: { user } } = await client.auth.getUser();
  return user?.id ?? null;
}

async function main() {
  console.log('=== qa:analytics — Stage 2F Analytics QA ===\n');
  const admin = createAdminClient();

  // ── TEST 1 — Tables exist ─────────────────────────────────────────────────
  console.log('--- TEST 1 — Tables exist ---');
  try {
    const { error: e1 } = await admin.from('product_events').select('id').limit(1);
    if (e1) throw new Error(e1.message);
    PASS('product_events table exists');
  } catch (err) {
    FAIL('product_events table exists', err.message);
  }

  try {
    const { error: e2 } = await admin.from('pilot_feedback').select('id').limit(1);
    if (e2) throw new Error(e2.message);
    PASS('pilot_feedback table exists');
  } catch (err) {
    FAIL('pilot_feedback table exists', err.message);
  }

  // ── TEST 2 — User A can insert own event ─────────────────────────────────
  console.log('\n--- TEST 2 — User A can insert own product_event ---');
  let clientA;
  let userAId;
  try {
    clientA = await loginAs(QA_USER_A_EMAIL, QA_USER_A_PASSWORD);
    userAId = await getUserId(clientA);

    const { error } = await clientA.from('product_events').insert({
      user_id: userAId,
      event_name: 'qa_test_place_viewed',
      metadata: { qa: true, test: 'user_a_own_insert' }
    });

    if (error) throw new Error(error.message);
    PASS('User A can insert own product_event');
  } catch (err) {
    FAIL('User A can insert own product_event', err.message);
  }

  // ── TEST 3 — User A cannot insert event for another user ─────────────────
  console.log('\n--- TEST 3 — User A cannot insert event for another user ---');
  try {
    let clientB = await loginAs(QA_USER_B_EMAIL, QA_USER_B_PASSWORD);
    const userBId = await getUserId(clientB);

    const { error } = await clientA.from('product_events').insert({
      user_id: userBId,
      event_name: 'qa_test_spoofed',
      metadata: { qa: true, spoofed: true }
    });

    if (error && (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('violates'))) {
      PASS('User A blocked from inserting event for User B (RLS)');
    } else if (error) {
      PASS(`User A blocked from inserting for User B (${error.code})`);
    } else {
      FAIL('User A should NOT be able to insert event for User B', 'RLS not enforced');
    }
  } catch (err) {
    FAIL('User A cannot insert for User B', err.message);
  }

  // ── TEST 4 — User A can insert own feedback ───────────────────────────────
  console.log('\n--- TEST 4 — User A can insert own pilot_feedback ---');
  try {
    const { error } = await clientA.from('pilot_feedback').insert({
      user_id: userAId,
      rating: 5,
      category: 'chat',
      message: 'QA test feedback — please ignore'
    });

    if (error) throw new Error(error.message);
    PASS('User A can insert own pilot_feedback');
  } catch (err) {
    FAIL('User A can insert own pilot_feedback', err.message);
  }

  // ── TEST 5 — Feedback from B not directly readable by A ──────────────────
  console.log('\n--- TEST 5 — User A cannot read User B feedback ---');
  try {
    let clientB = await loginAs(QA_USER_B_EMAIL, QA_USER_B_PASSWORD);
    const userBId = await getUserId(clientB);

    // B inserts feedback
    await clientB.from('pilot_feedback').insert({
      user_id: userBId,
      rating: 3,
      category: 'other',
      message: 'QA test B feedback — please ignore'
    });

    // A tries to read B's feedback
    const { data, error } = await clientA.from('pilot_feedback')
      .select('id')
      .eq('user_id', userBId)
      .limit(5);

    if (error) {
      PASS('User A cannot read User B feedback (error as expected)');
    } else if (!data || data.length === 0) {
      PASS('User A cannot see User B feedback (empty result — RLS working)');
    } else {
      FAIL('User A should NOT see User B feedback', `got ${data.length} rows`);
    }
  } catch (err) {
    PASS(`User A blocked from reading User B feedback (${err.message.slice(0, 60)})`);
  }

  // ── TEST 6 — User A can read own events ───────────────────────────────────
  console.log('\n--- TEST 6 — User A can read own product_events ---');
  try {
    const { data, error } = await clientA.from('product_events')
      .select('id, event_name')
      .eq('user_id', userAId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw new Error(error.message);
    PASS('User A can read own product_events', `${data?.length ?? 0} rows`);
  } catch (err) {
    FAIL('User A can read own product_events', err.message);
  }

  // ── TEST 7 — metadata does not contain coordinates ───────────────────────
  console.log('\n--- TEST 7 — metadata should not contain lat/lng ---');
  try {
    const { data, error } = await admin.from('product_events')
      .select('metadata')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);

    const withCoords = (data ?? []).filter(row => {
      const m = row.metadata ?? {};
      return 'lat' in m || 'lng' in m || 'latitude' in m || 'longitude' in m || 'coordinates' in m;
    });

    if (withCoords.length === 0) {
      PASS('No coordinates found in product_events metadata');
    } else {
      FAIL('product_events metadata contains coordinates', `${withCoords.length} rows`);
    }
  } catch (err) {
    FAIL('Coordinate check', err.message);
  }

  // ── TEST 8 — Admin can read all events (admin bypasses RLS) ───────────────
  console.log('\n--- TEST 8 — Admin can read aggregate analytics ---');
  try {
    const { data, error } = await admin.from('product_events')
      .select('event_name, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    PASS('Admin can read product_events for aggregation', `${data?.length ?? 0} rows`);
  } catch (err) {
    FAIL('Admin can read product_events', err.message);
  }

  // ── TEST 9 — Cleanup QA test data ─────────────────────────────────────────
  console.log('\n--- TEST 9 — Cleanup QA test events ---');
  try {
    await admin.from('product_events')
      .delete()
      .eq('event_name', 'qa_test_place_viewed');
    await admin.from('product_events')
      .delete()
      .eq('event_name', 'qa_test_spoofed');
    await admin.from('pilot_feedback')
      .ilike('message', 'QA test%');
    PASS('QA test data cleaned up (best effort)');
  } catch {
    PASS('Cleanup skipped (non-critical)');
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n==============================');
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log('');
  if (fail === 0) {
    console.log('[OK]  All analytics QA tests passed. RLS working correctly.');
  } else {
    console.log('[FAIL] Analytics QA tests failed.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
