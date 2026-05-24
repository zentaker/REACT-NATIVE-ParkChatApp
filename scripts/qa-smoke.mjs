#!/usr/bin/env node
/**
 * qa-smoke.mjs
 * Full smoke test against real Supabase using normal user clients.
 *
 * SECURITY MODEL:
 * - service_role is used ONLY to look up QA user IDs at startup.
 * - All actual app operations use normal anon+JWT clients (same as the real app).
 * - RLS is validated by attempting hostile operations and expecting failures.
 *
 * Uses the ACTUAL Supabase DB schema:
 *   reports: reporter_id, reported_user_id, place_id, message_id, group_id, event_id, reason, details, status
 *   blocks:  blocker_id, blocked_id (+ auto id)
 *
 * Run qa-seed.mjs first.
 */

import { createAdminClient, createAnonClient, createUserClient } from './lib/supabase-admin.mjs';
import {
  QA_USER_A_EMAIL as QA_EMAIL_A,
  QA_USER_A_PASSWORD as QA_PASSWORD,
  QA_USER_B_EMAIL as QA_EMAIL_B
} from './lib/qa-config.mjs';
const PARK_KENNEDY_ID = '11111111-1111-4111-8111-111111111111';

let passed = 0;
let failed = 0;
const failures = [];

function ok(label) {
  console.log('[PASS] ' + label);
  passed++;
}

function fail(label, detail) {
  console.log('[FAIL] ' + label + (detail ? ' — ' + detail : ''));
  failed++;
  failures.push(label + (detail ? ': ' + detail : ''));
}

function skip(label, reason) {
  console.log('[SKIP] ' + label + (reason ? ' — ' + reason : ''));
}

function section(title) {
  console.log('\n--- ' + title + ' ---');
}

async function loginUser(email) {
  const anon = createAnonClient();
  const { data, error } = await anon.auth.signInWithPassword({ email, password: QA_PASSWORD });
  if (error || !data.session) {
    throw new Error('Login failed for ' + email + ': ' + (error?.message ?? 'no session'));
  }
  return { client: createUserClient(data.session.access_token), userId: data.user.id };
}

async function run() {
  console.log('Aldea / ParkChat — QA Smoke Test');
  console.log('==================================');

  // SETUP: resolve QA user IDs via admin (only admin call)
  section('SETUP — resolve QA user IDs');
  let admin;
  try { admin = createAdminClient(); } catch (e) {
    console.log('[FATAL] Admin client error: ' + e.message); process.exit(1);
  }

  const { data: userList, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) { console.log('[FATAL] Cannot list users: ' + listErr.message); process.exit(1); }

  const authUserA = userList.users.find(u => u.email === QA_EMAIL_A);
  const authUserB = userList.users.find(u => u.email === QA_EMAIL_B);
  if (!authUserA) { console.log('[FATAL] User A not found — run qa-seed.mjs first.'); process.exit(1); }
  if (!authUserB) { console.log('[FATAL] User B not found — run qa-seed.mjs first.'); process.exit(1); }

  const USER_A_ID = authUserA.id;
  const USER_B_ID = authUserB.id;
  console.log('[OK]  User A: ' + USER_A_ID.slice(0, 8) + '...');
  console.log('[OK]  User B: ' + USER_B_ID.slice(0, 8) + '...');

  // AUTH: login both users with normal anon+password client
  section('AUTH — login (anon key + password, no service_role)');
  let clientA, clientB;

  try {
    ({ client: clientA } = await loginUser(QA_EMAIL_A));
    ok('Login User A');
  } catch (e) {
    fail('Login User A', e.message);
    console.log('[FATAL] Cannot continue without User A session.'); process.exit(1);
  }

  try {
    ({ client: clientB } = await loginUser(QA_EMAIL_B));
    ok('Login User B');
  } catch (e) {
    fail('Login User B', e.message);
    console.log('[FATAL] Cannot continue without User B session.'); process.exit(1);
  }

  // PLACES: User A reads places
  section('PLACES — authenticated read');

  const { data: places, error: placesErr } = await clientA
    .from('places').select('id,name,city,type,visibility').eq('visibility', 'public');

  if (placesErr) {
    fail('User A reads places', placesErr.message);
  } else if (!places || places.length === 0) {
    fail('User A reads places', 'empty — run qa-seed.mjs first');
  } else {
    ok('User A reads places (' + places.length + ' rows)');
    places.forEach(p => console.log('      - ' + p.name + ' (' + p.city + ', type=' + p.type + ')'));
  }

  // PROFILES: User A reads own profile
  section('PROFILES — authenticated read');

  const { data: ownProfile, error: ownProfErr } = await clientA
    .from('profiles').select('id,display_name,role').eq('id', USER_A_ID).maybeSingle();

  if (ownProfErr) {
    fail('User A reads own profile', ownProfErr.message);
  } else if (!ownProfile) {
    fail('User A reads own profile', 'not found');
  } else {
    ok('User A reads own profile (display_name=' + ownProfile.display_name + ', role=' + (ownProfile.role ?? 'null') + ')');
  }

  // CHAT: User A sends message
  section('CHAT — insert place_message as User A');

  const msgBody = 'QA smoke test A @ ' + new Date().toISOString();
  const { data: insertedMsg, error: insertMsgErr } = await clientA
    .from('place_messages')
    .insert({ place_id: PARK_KENNEDY_ID, user_id: USER_A_ID, body: msgBody })
    .select('id,place_id,user_id,body').single();

  let msgAId = null;
  if (insertMsgErr) {
    fail('User A inserts place_message', insertMsgErr.message);
  } else {
    msgAId = insertedMsg.id;
    if (insertedMsg.user_id !== USER_A_ID) {
      fail('Message has correct user_id', 'got ' + insertedMsg.user_id);
    } else {
      ok('User A inserts place_message (id=' + msgAId.slice(0, 8) + '...)');
    }
  }

  // CHAT: User B reads messages
  section('CHAT — User B reads messages from same place');

  const { data: msgsB, error: readBErr } = await clientB
    .from('place_messages').select('id,user_id,body')
    .eq('place_id', PARK_KENNEDY_ID).order('created_at', { ascending: false }).limit(20);

  if (readBErr) {
    fail('User B reads place_messages', readBErr.message);
  } else {
    const found = msgsB?.some(m => m.id === msgAId);
    if (found) {
      ok('User B sees message from A (' + (msgsB?.length ?? 0) + ' total msgs)');
    } else {
      fail('User B sees message from A', 'not found (rows=' + (msgsB?.length ?? 0) + ')');
    }
  }

  // CHAT: User B replies
  section('CHAT — User B replies');

  const replyBody = 'QA reply from B @ ' + new Date().toISOString();
  const { data: replyMsg, error: replyErr } = await clientB
    .from('place_messages')
    .insert({ place_id: PARK_KENNEDY_ID, user_id: USER_B_ID, body: replyBody })
    .select('id,user_id').single();

  let msgBId = null;
  if (replyErr) {
    fail('User B inserts reply', replyErr.message);
  } else {
    msgBId = replyMsg.id;
    ok('User B inserts reply (id=' + msgBId.slice(0, 8) + '...)');
  }

  // CHAT: User A reads reply
  section('CHAT — User A reads reply from B');

  const { data: msgsA2, error: readA2Err } = await clientA
    .from('place_messages').select('id,user_id')
    .eq('place_id', PARK_KENNEDY_ID).order('created_at', { ascending: false }).limit(20);

  if (readA2Err) {
    fail('User A reads messages post-B-reply', readA2Err.message);
  } else {
    const found = msgsA2?.some(m => m.id === msgBId);
    found ? ok('User A sees reply from B') : fail('User A sees reply from B', 'not found');
  }

  // RLS: A tries to insert message with B user_id (spoof)
  section('RLS — hostile insert: A spoofs B user_id on place_message');

  const { error: spoofMsgErr } = await clientA
    .from('place_messages')
    .insert({ place_id: PARK_KENNEDY_ID, user_id: USER_B_ID, body: 'spoof' });

  if (!spoofMsgErr) {
    fail('RLS blocks A spoofing B user_id in place_messages', 'INSERT SUCCEEDED — RLS HOLE');
  } else {
    ok('RLS blocks A from spoofing B user_id (' + (spoofMsgErr.code ?? spoofMsgErr.message.slice(0, 40)) + ')');
  }

  // RLS: A tries to update B's message
  section('RLS — hostile update: A edits B message');

  if (msgBId) {
    const { data: upResult, error: upErr } = await clientA
      .from('place_messages').update({ body: 'hijacked' }).eq('id', msgBId).select('id');

    if (upErr) {
      ok('RLS blocks A from updating B message (' + upErr.code + ')');
    } else if (!upResult || upResult.length === 0) {
      ok('RLS: update returned 0 rows — A cannot edit B message');
    } else {
      fail('RLS blocks A from updating B message', 'UPDATE AFFECTED — RLS HOLE');
    }
  } else {
    skip('RLS hostile update', 'B message ID not available');
  }

  // RLS: A tries to update B profile
  section('RLS — hostile profile update: A edits B profile');

  const { data: profUp, error: profUpErr } = await clientA
    .from('profiles').update({ display_name: 'hacked' }).eq('id', USER_B_ID).select('id');

  if (profUpErr) {
    ok('RLS blocks A from updating B profile (' + profUpErr.code + ')');
  } else if (!profUp || profUp.length === 0) {
    ok('RLS: profile update 0 rows — A cannot edit B profile');
  } else {
    fail('RLS blocks A from updating B profile', 'UPDATE AFFECTED — RLS HOLE');
  }

  // RLS: A reads B profile (should succeed — profiles are readable by authenticated)
  section('RLS — profile read: A reads B profile (expected: allowed)');

  const { data: bProfile, error: bProfErr } = await clientA
    .from('profiles').select('id,display_name').eq('id', USER_B_ID).maybeSingle();

  if (bProfErr) {
    fail('User A reads User B profile', bProfErr.message);
  } else if (!bProfile) {
    fail('User A reads User B profile', 'not found');
  } else {
    ok('User A reads User B profile (display_name=' + bProfile.display_name + ')');
  }

  // REPORTS: A creates own report (reporting a message)
  section('REPORTS — User A reports a message');

  let reportId = null;
  if (msgBId) {
    const { data: report, error: reportErr } = await clientA
      .from('reports')
      .insert({ reporter_id: USER_A_ID, message_id: msgBId, reason: 'spam', details: 'QA smoke test' })
      .select('id,reporter_id,status').single();

    if (reportErr) {
      fail('User A creates report', reportErr.message);
    } else {
      reportId = report.id;
      ok('User A creates report (id=' + reportId.slice(0, 8) + '..., status=' + report.status + ')');
    }
  } else {
    skip('User A creates report', 'no message B ID — using place as target');
    const { data: report, error: reportErr } = await clientA
      .from('reports')
      .insert({ reporter_id: USER_A_ID, place_id: PARK_KENNEDY_ID, reason: 'spam', details: 'QA smoke test' })
      .select('id,reporter_id,status').single();

    if (reportErr) { fail('User A creates report (place)', reportErr.message); }
    else { reportId = report.id; ok('User A creates report on place (id=' + reportId.slice(0, 8) + '...)'); }
  }

  // RLS: A spoofs reporter_id of B
  section('RLS — hostile report: A spoofs B reporter_id');

  const { error: spoofReportErr } = await clientA
    .from('reports')
    .insert({ reporter_id: USER_B_ID, place_id: PARK_KENNEDY_ID, reason: 'spoof' });

  if (!spoofReportErr) {
    fail('RLS blocks A spoofing B reporter_id', 'INSERT SUCCEEDED — RLS HOLE');
  } else {
    ok('RLS blocks A from spoofing B reporter_id (' + (spoofReportErr.code ?? spoofReportErr.message.slice(0, 40)) + ')');
  }

  // BLOCKS: A blocks B
  section('BLOCKS — User A blocks User B');

  const { error: blockErr } = await clientA
    .from('blocks').insert({ blocker_id: USER_A_ID, blocked_id: USER_B_ID });

  if (blockErr && !blockErr.message.includes('duplicate')) {
    fail('User A blocks User B', blockErr.message);
  } else {
    ok('User A blocks User B (or block already existed)');
  }

  // RLS: Post-block, A should NOT see B's messages
  section('RLS — post-block: B messages filtered from A view');

  const { data: msgsPostBlock, error: postBlockErr } = await clientA
    .from('place_messages').select('id,user_id').eq('place_id', PARK_KENNEDY_ID);

  if (postBlockErr) {
    fail('User A reads messages post-block', postBlockErr.message);
  } else {
    const bVisible = msgsPostBlock?.filter(m => m.user_id === USER_B_ID) ?? [];
    if (bVisible.length === 0) {
      ok('RLS post-block: B messages filtered from A view (0 visible)');
    } else {
      fail('RLS post-block: B messages still visible to A', bVisible.length + ' msgs visible');
    }
  }

  // RLS: A tries to create block with B's blocker_id (spoof)
  section('RLS — hostile block: A spoofs B blocker_id');

  const { error: spoofBlockErr } = await clientA
    .from('blocks').insert({ blocker_id: USER_B_ID, blocked_id: USER_A_ID });

  if (!spoofBlockErr) {
    fail('RLS blocks A spoofing B blocker_id', 'INSERT SUCCEEDED — RLS HOLE');
  } else {
    ok('RLS blocks A from spoofing B blocker_id (' + (spoofBlockErr.code ?? spoofBlockErr.message.slice(0, 40)) + ')');
  }

  // GROUPS: User A creates a group
  section('GROUPS — User A creates group');

  const { data: newGroup, error: groupErr } = await clientA
    .from('groups')
    .insert({ place_id: PARK_KENNEDY_ID, name: 'QA Test Group ' + Date.now(), description: 'QA smoke test group', access_level: 'public', created_by: USER_A_ID })
    .select('id,name,access_level,created_by').single();

  let qaGroupId = null;
  if (groupErr) {
    fail('User A creates group', groupErr.message);
  } else {
    qaGroupId = newGroup.id;
    ok('User A creates group (id=' + qaGroupId.slice(0, 8) + '..., access_level=' + newGroup.access_level + ')');
  }

  // GROUPS: B reads public groups
  section('GROUPS — User B reads public groups');

  const { data: publicGroups, error: readGroupErr } = await clientB
    .from('groups').select('id,name,access_level').limit(5);

  if (readGroupErr) {
    fail('User B reads groups', readGroupErr.message);
  } else {
    ok('User B reads groups (' + (publicGroups?.length ?? 0) + ' visible)');
  }

  // GROUPS: A tries to create group with B's created_by (spoof)
  section('RLS — hostile group: A spoofs B created_by');

  const { error: spoofGroupErr } = await clientA
    .from('groups')
    .insert({ place_id: PARK_KENNEDY_ID, name: 'spoof group', access_level: 'public', created_by: USER_B_ID });

  if (!spoofGroupErr) {
    fail('RLS blocks A spoofing B created_by in groups', 'INSERT SUCCEEDED — RLS HOLE');
  } else {
    ok('RLS blocks A from spoofing B created_by in groups (' + (spoofGroupErr.code ?? spoofGroupErr.message.slice(0, 40)) + ')');
  }

  // EVENTS: User A creates an event
  section('EVENTS — User A creates event');

  const { data: newEvent, error: eventErr } = await clientA
    .from('events')
    .insert({
      place_id: PARK_KENNEDY_ID,
      title: 'QA Test Event ' + Date.now(),
      description: 'QA smoke test event',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      created_by: USER_A_ID,
      access_level: 'public',
      source_type: 'place',
    })
    .select('id,title,access_level').single();

  let qaEventId = null;
  if (eventErr) {
    fail('User A creates event', eventErr.message);
  } else {
    qaEventId = newEvent.id;
    ok('User A creates event (id=' + qaEventId.slice(0, 8) + '...)');
  }

  // EVENTS: RSVP — User B RSVPs
  section('EVENTS — User B RSVPs (going)');

  if (qaEventId) {
    const { error: rsvpErr } = await clientB
      .from('event_rsvps')
      .upsert({ event_id: qaEventId, user_id: USER_B_ID, status: 'going' }, { onConflict: 'event_id,user_id' });

    if (rsvpErr) {
      fail('User B RSVPs going', rsvpErr.message);
    } else {
      ok('User B RSVPs going to event');
    }

    // RLS: B tries to RSVP with A's user_id
    section('RLS — hostile RSVP: B spoofs A user_id');
    const { error: spoofRsvpErr } = await clientB
      .from('event_rsvps')
      .upsert({ event_id: qaEventId, user_id: USER_A_ID, status: 'going' }, { onConflict: 'event_id,user_id' });

    if (!spoofRsvpErr) {
      fail('RLS blocks B spoofing A RSVP user_id', 'UPSERT SUCCEEDED — RLS HOLE');
    } else {
      ok('RLS blocks B from spoofing A RSVP (' + (spoofRsvpErr.code ?? spoofRsvpErr.message.slice(0, 40)) + ')');
    }
  } else {
    skip('RSVP tests', 'event creation failed');
    skip('RLS RSVP spoof', 'event creation failed');
  }

  // CLEANUP: remove block
  await clientA.from('blocks').delete().eq('blocker_id', USER_A_ID).eq('blocked_id', USER_B_ID);

  // REALTIME
  section('REALTIME — note');
  console.log('[NOTE] Realtime requires persistent WebSocket — validated manually in browser.');
  console.log('       place_messages IS published in supabase_realtime (schema.sql).');
  console.log('       Manual test: two browser tabs, same place, one sends, other receives instantly.');

  // FINAL SUMMARY
  console.log('\n==============================');
  console.log('QA SMOKE TEST SUMMARY');
  console.log('==============================');
  console.log('PASS: ' + passed);
  console.log('FAIL: ' + failed);
  if (failures.length > 0) {
    console.log('\nFailed checks:');
    failures.forEach(f => console.log('  - ' + f));
  }
  console.log('');

  if (failed === 0) {
    console.log('[OK]  All smoke tests passed. RLS working correctly.');
  } else {
    console.log('[FAIL] ' + failed + ' test(s) failed. See above.');
    process.exit(1);
  }
}

run().catch(e => {
  console.error('[FATAL]', e.message);
  process.exit(1);
});
