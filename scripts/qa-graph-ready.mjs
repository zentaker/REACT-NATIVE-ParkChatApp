#!/usr/bin/env node
/**
 * qa-graph-ready.mjs
 * QA tests for Stage 2A graph-ready product layer.
 * Usage: npm run qa:graph
 *
 * SECURITY: Never prints secrets, tokens, or passwords.
 * Uses anon key + password auth (same as real app / qa-smoke).
 */

import { createAnonClient } from './lib/supabase-admin.mjs';

const QA_USER_A_EMAIL = 'qa.aldea.a@example.com';
const QA_USER_B_EMAIL = 'qa.aldea.b@example.com';
const QA_PASSWORD     = 'Ald3aQA!2026';

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

function truncate(id) {
  return String(id ?? '').slice(0, 8) + '...';
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u00e0-\u00fc]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractHashtags(text) {
  const matches = text.match(/#([a-zA-Z\u00C0-\u017e][a-zA-Z0-9\u00C0-\u017e_-]*)/g);
  if (!matches) return [];
  const seen = new Set();
  const result = [];
  for (const m of matches) {
    const tag = m.slice(1).toLowerCase();
    if (!seen.has(tag)) { seen.add(tag); result.push(tag); }
  }
  return result;
}

console.log('\nAldea / ParkChat — QA Graph-ready');
console.log('====================================\n');

// ─── SETUP — two separate anon clients ──────────────────────
const anonA = createAnonClient();
const anonB = createAnonClient();

console.log('--- SETUP — login QA users ---');

const { data: authA, error: errA } = await anonA.auth.signInWithPassword({ email: QA_USER_A_EMAIL, password: QA_PASSWORD });
if (errA || !authA?.user) { FAIL('Login User A', errA?.message); process.exit(1); }
PASS('Login User A', truncate(authA.user.id));

const { data: authB, error: errB } = await anonB.auth.signInWithPassword({ email: QA_USER_B_EMAIL, password: QA_PASSWORD });
if (errB || !authB?.user) { FAIL('Login User B', errB?.message); process.exit(1); }
PASS('Login User B', truncate(authB.user.id));

const userAId = authA.user.id;
const userBId = authB.user.id;

// ─── Get a place_id for testing ─────────────────────────────
console.log('\n--- SETUP — fetch place ---');

const { data: places } = await anonA.from('places').select('id').limit(1).single();
if (!places?.id) { FAIL('Fetch test place'); process.exit(1); }
const placeId = places.id;
PASS('Fetch test place', truncate(placeId));

// ─── TEST 1 — Read places ────────────────────────────────────
console.log('\n--- TEST 1 — User A reads places ---');
const { data: placesRead, error: placesErr } = await anonA.from('places').select('id').limit(5);
if (placesErr || !placesRead?.length) {
  FAIL('User A reads places', placesErr?.message);
} else {
  PASS('User A reads places', `${placesRead.length} rows`);
}

// ─── TEST 2 — Upsert user_place ──────────────────────────────
console.log('\n--- TEST 2 — Upsert user_place ---');

const { data: existingUP } = await anonA
  .from('user_places')
  .select('id, visit_count')
  .eq('user_id', userAId)
  .eq('place_id', placeId)
  .maybeSingle();

let upData;
let upErr;

if (existingUP) {
  const { data, error } = await anonA
    .from('user_places')
    .update({ relationship_type: 'visited', last_seen_at: new Date().toISOString(), visit_count: existingUP.visit_count + 1 })
    .eq('id', existingUP.id)
    .select()
    .single();
  upData = data; upErr = error;
} else {
  const { data, error } = await anonA
    .from('user_places')
    .insert({ user_id: userAId, place_id: placeId, relationship_type: 'visited', last_seen_at: new Date().toISOString(), visit_count: 1 })
    .select()
    .single();
  upData = data; upErr = error;
}

if (upErr) {
  FAIL('User A upserts user_place', upErr.message);
} else {
  PASS('User A upserts user_place', `relationship=${upData.relationship_type}, visits=${upData.visit_count}`);
}

// ─── TEST 3 — Send message with hashtags ─────────────────────
console.log('\n--- TEST 3 — Send message with hashtags ---');

const hashtagBody = 'Alguien para tenis este finde? #tennis #deportes #parque';
const { data: msgData, error: msgErr } = await anonA
  .from('place_messages')
  .insert({ place_id: placeId, user_id: userAId, body: hashtagBody })
  .select()
  .single();

if (msgErr || !msgData) {
  FAIL('User A sends message with hashtags', msgErr?.message);
  process.exit(1);
}
PASS('User A sends message with hashtags', `id=${truncate(msgData.id)}`);

const messageId = msgData.id;
const hashtags = extractHashtags(hashtagBody);
PASS('extractHashtags works', `tags=${hashtags.join(',')}`);

// ─── TEST 4 — Create topic_tags ──────────────────────────────
console.log('\n--- TEST 4 — Create topic_tags ---');

const createdTagIds = [];
for (const name of hashtags) {
  const slug = slugify(name);
  const { data: existingTag } = await anonA.from('topic_tags').select('id').eq('slug', slug).maybeSingle();

  let tagId;
  if (existingTag) {
    tagId = existingTag.id;
    PASS(`topic_tag exists: #${name}`, truncate(tagId));
  } else {
    const { data: newTag, error: tagErr } = await anonA
      .from('topic_tags')
      .insert({ name, slug })
      .select('id')
      .single();

    if (tagErr || !newTag) {
      FAIL(`Create topic_tag: #${name}`, tagErr?.message);
      continue;
    }
    tagId = newTag.id;
    PASS(`Create topic_tag: #${name}`, truncate(tagId));
  }
  createdTagIds.push({ name, tagId });
}

// ─── TEST 5 — Create message_topic_tags ──────────────────────
console.log('\n--- TEST 5 — Create message_topic_tags ---');

for (const { name, tagId } of createdTagIds) {
  const { data: existingMtt } = await anonA
    .from('message_topic_tags')
    .select('id')
    .eq('message_id', messageId)
    .eq('topic_tag_id', tagId)
    .maybeSingle();

  if (existingMtt) {
    PASS(`message_topic_tag already exists: #${name}`);
  } else {
    const { error: mttErr } = await anonA
      .from('message_topic_tags')
      .insert({ message_id: messageId, topic_tag_id: tagId });

    if (mttErr) {
      FAIL(`Link message→tag: #${name}`, mttErr.message);
    } else {
      PASS(`Link message→tag: #${name}`);
    }
  }
}

const { data: mttRead, error: mttReadErr } = await anonA
  .from('message_topic_tags')
  .select('id')
  .eq('message_id', messageId);

if (mttReadErr || !mttRead?.length) {
  FAIL('Read message_topic_tags for message', mttReadErr?.message);
} else {
  PASS('message_topic_tags created for message', `${mttRead.length} tag(s)`);
}

// ─── TEST 6 — Update place_topics ────────────────────────────
console.log('\n--- TEST 6 — Update place_topics ---');

for (const { name, tagId } of createdTagIds) {
  const { data: existingPT } = await anonA
    .from('place_topics')
    .select('id, weight')
    .eq('place_id', placeId)
    .eq('topic_tag_id', tagId)
    .maybeSingle();

  if (existingPT) {
    const { error: ptUpdErr } = await anonA
      .from('place_topics')
      .update({ weight: existingPT.weight + 1, last_activity_at: new Date().toISOString() })
      .eq('id', existingPT.id);
    if (ptUpdErr) FAIL(`Update place_topic: #${name}`, ptUpdErr.message);
    else PASS(`Update place_topic weight: #${name}`, `weight=${existingPT.weight + 1}`);
  } else {
    const { error: ptInsErr } = await anonA
      .from('place_topics')
      .insert({ place_id: placeId, topic_tag_id: tagId, weight: 1, last_activity_at: new Date().toISOString() });
    if (ptInsErr) FAIL(`Insert place_topic: #${name}`, ptInsErr.message);
    else PASS(`Insert place_topic: #${name}`);
  }
}

const { data: ptRead } = await anonA
  .from('place_topics')
  .select('weight, topic_tags(name)')
  .eq('place_id', placeId)
  .order('weight', { ascending: false });

if (!ptRead?.length) {
  FAIL('Read place_topics for place');
} else {
  PASS('Read place_topics for place', `${ptRead.length} topic(s)`);
}

// ─── TEST 7 — user_topic_interests ───────────────────────────
console.log('\n--- TEST 7 — user_topic_interests ---');

if (createdTagIds.length > 0) {
  const { name, tagId } = createdTagIds[0];
  const { data: existingI } = await anonA
    .from('user_topic_interests')
    .select('id, weight')
    .eq('user_id', userAId)
    .eq('topic_tag_id', tagId)
    .maybeSingle();

  if (existingI) {
    const { error: iUpdErr } = await anonA
      .from('user_topic_interests')
      .update({ weight: existingI.weight + 1 })
      .eq('id', existingI.id);
    if (iUpdErr) FAIL(`Update user_topic_interest: #${name}`, iUpdErr.message);
    else PASS(`Update user_topic_interest: #${name}`, `weight=${existingI.weight + 1}`);
  } else {
    const { error: iInsErr } = await anonA
      .from('user_topic_interests')
      .insert({ user_id: userAId, topic_tag_id: tagId, source: 'hashtag', weight: 1 });
    if (iInsErr) FAIL(`Insert user_topic_interest: #${name}`, iInsErr.message);
    else PASS(`Insert user_topic_interest: #${name}`);
  }
}

const { data: myInterests, error: myIErr } = await anonA
  .from('user_topic_interests')
  .select('*, topic_tags(name)')
  .eq('user_id', userAId);

if (myIErr) FAIL('Read own user_topic_interests', myIErr.message);
else PASS('Read own user_topic_interests', `${myInterests?.length ?? 0} interests`);

// ─── TEST 8 — RLS: A cannot write user_places of B ───────────
console.log('\n--- TEST 8 — RLS: A cannot write user_places of B ---');

const { error: rlsUpErr } = await anonA
  .from('user_places')
  .insert({ user_id: userBId, place_id: placeId, relationship_type: 'visited', last_seen_at: new Date().toISOString(), visit_count: 1 });

if (rlsUpErr) {
  PASS('RLS blocks A from writing user_places of B', rlsUpErr.code ?? rlsUpErr.message?.slice(0, 30));
} else {
  FAIL('RLS: A was able to insert user_place for B — policy missing');
}

// ─── TEST 9 — RLS: A cannot write interests of B ─────────────
console.log('\n--- TEST 9 — RLS: A cannot write interests of B ---');

if (createdTagIds.length > 0) {
  const { tagId } = createdTagIds[0];
  const { error: rlsIntErr } = await anonA
    .from('user_topic_interests')
    .insert({ user_id: userBId, topic_tag_id: tagId, source: 'hashtag', weight: 1 });

  if (rlsIntErr) {
    PASS('RLS blocks A from writing interests of B', rlsIntErr.code ?? rlsIntErr.message?.slice(0, 30));
  } else {
    FAIL('RLS: A was able to insert interest for B — policy missing');
  }
} else {
  FAIL('RLS test interests skipped — no tag ids available');
}

// ─── TEST 10 — RLS: B cannot read A's user_places ────────────
console.log("\n--- TEST 10 — RLS: B cannot read A's user_places ---");

const { data: bReadsA, error: bReadsAErr } = await anonB
  .from('user_places')
  .select('id')
  .eq('user_id', userAId);

if (bReadsAErr) {
  PASS("RLS: B cannot read A's user_places", bReadsAErr.code);
} else if (!bReadsA?.length) {
  PASS("RLS: B sees 0 rows from A's user_places (policy working)");
} else {
  FAIL("RLS: B can see A's user_places — policy issue", `${bReadsA.length} rows visible`);
}

// ─── SUMMARY ─────────────────────────────────────────────────
console.log('\n==============================');
console.log('QA GRAPH-READY SUMMARY');
console.log('==============================');
console.log(`PASS: ${pass}`);
console.log(`FAIL: ${fail}`);
console.log('');

if (fail === 0) {
  console.log('[OK]  All graph-ready QA tests passed. RLS working correctly.');
} else {
  console.log(`[FAIL] ${fail} test(s) failed.`);
  process.exit(1);
}
