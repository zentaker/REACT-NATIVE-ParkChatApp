#!/usr/bin/env node
/**
 * check-graph-ready.mjs
 * Verifies Stage 2A graph-ready tables, RLS, policies, and indexes exist in Supabase.
 * Usage: npm run supabase:check:graph
 *
 * SECURITY: Never prints secrets, tokens, or passwords.
 */

import { executeSQL } from './lib/supabase-db-url.mjs';

const EXPECTED_TABLES = [
  'user_places',
  'topic_tags',
  'message_topic_tags',
  'place_topics',
  'user_topic_interests',
  'user_connections',
];

const EXPECTED_POLICIES = [
  { table: 'topic_tags',            policy: 'topic_tags: authenticated can read' },
  { table: 'topic_tags',            policy: 'topic_tags: authenticated can insert' },
  { table: 'place_topics',          policy: 'place_topics: authenticated can read' },
  { table: 'place_topics',          policy: 'place_topics: authenticated can insert' },
  { table: 'user_places',           policy: 'user_places: user reads own' },
  { table: 'user_places',           policy: 'user_places: user inserts own' },
  { table: 'user_places',           policy: 'user_places: user updates own' },
  { table: 'message_topic_tags',    policy: 'message_topic_tags: authenticated can read' },
  { table: 'message_topic_tags',    policy: 'message_topic_tags: authenticated can insert' },
  { table: 'user_topic_interests',  policy: 'user_topic_interests: user reads own' },
  { table: 'user_topic_interests',  policy: 'user_topic_interests: user inserts own' },
  { table: 'user_connections',      policy: 'user_connections: user reads own connections' },
];

const EXPECTED_INDEXES = [
  'user_places_user_id_idx',
  'user_places_place_id_idx',
  'topic_tags_slug_idx',
  'message_topic_tags_message_idx',
  'place_topics_place_id_idx',
  'place_topics_weight_idx',
  'user_topic_interests_user_id_idx',
  'user_connections_user_a_idx',
  'user_connections_user_b_idx',
];

let ok = 0;
let fail = 0;

function pass(msg) { console.log('[OK]  ' + msg); ok++; }
function error(msg) { console.log('[FAIL] ' + msg); fail++; }

console.log('\nAldea / ParkChat — Graph-ready DB Check');
console.log('=========================================\n');

// --- Tables exist ---
const tableCheckSql = `
  select table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_name = any(array[${EXPECTED_TABLES.map(t => `'${t}'`).join(',')}])
`;

let existingTables = [];
try {
  const result = await executeSQL(tableCheckSql);
  existingTables = (result.rows || []).map(r => r.table_name);
} catch (e) {
  console.error('[ERROR] Could not query tables:', e.message);
  process.exit(1);
}

console.log('--- Tables ---');
for (const t of EXPECTED_TABLES) {
  if (existingTables.includes(t)) {
    pass(`Table exists: ${t}`);
  } else {
    error(`Table MISSING: ${t} — run: npm run supabase:apply:graph`);
  }
}

// --- RLS enabled ---
const rlsSql = `
  select relname
  from pg_class
  join pg_namespace on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public'
    and relrowsecurity = true
    and relname = any(array[${EXPECTED_TABLES.map(t => `'${t}'`).join(',')}])
`;

let rlsTables = [];
try {
  const result = await executeSQL(rlsSql);
  rlsTables = (result.rows || []).map(r => r.relname);
} catch (e) {
  console.error('[ERROR] Could not query RLS:', e.message);
}

console.log('\n--- RLS enabled ---');
for (const t of EXPECTED_TABLES) {
  if (!existingTables.includes(t)) continue;
  if (rlsTables.includes(t)) {
    pass(`RLS enabled: ${t}`);
  } else {
    error(`RLS NOT enabled: ${t}`);
  }
}

// --- Policies ---
const policySql = `
  select tablename, policyname
  from pg_policies
  where schemaname = 'public'
    and tablename = any(array[${EXPECTED_TABLES.map(t => `'${t}'`).join(',')}])
`;

let existingPolicies = [];
try {
  const result = await executeSQL(policySql);
  existingPolicies = (result.rows || []).map(r => `${r.tablename}::${r.policyname}`);
} catch (e) {
  console.error('[ERROR] Could not query policies:', e.message);
}

console.log('\n--- Policies ---');
for (const { table, policy } of EXPECTED_POLICIES) {
  const key = `${table}::${policy}`;
  if (existingPolicies.includes(key)) {
    pass(`Policy: "${policy}"`);
  } else {
    error(`Policy MISSING: "${policy}" on ${table}`);
  }
}

// --- Indexes ---
const indexSql = `
  select indexname
  from pg_indexes
  where schemaname = 'public'
    and indexname = any(array[${EXPECTED_INDEXES.map(i => `'${i}'`).join(',')}])
`;

let existingIndexes = [];
try {
  const result = await executeSQL(indexSql);
  existingIndexes = (result.rows || []).map(r => r.indexname);
} catch (e) {
  console.error('[ERROR] Could not query indexes:', e.message);
}

console.log('\n--- Indexes ---');
for (const idx of EXPECTED_INDEXES) {
  if (existingIndexes.includes(idx)) {
    pass(`Index exists: ${idx}`);
  } else {
    error(`Index MISSING: ${idx}`);
  }
}

// --- Summary ---
console.log('\n--- SUMMARY ---');
console.log(`OK:   ${ok}`);
console.log(`FAIL: ${fail}`);
console.log('');

if (fail === 0) {
  console.log('[OK]  Graph-ready schema verified. All checks passed.');
} else {
  console.log(`[FAIL] ${fail} check(s) failed. Run: npm run supabase:apply:graph`);
  process.exit(1);
}
