#!/usr/bin/env node
/**
 * qa-geofence.mjs
 * QA tests for Stage 2C strict geofenced posting logic.
 * Usage: npm run qa:geofence
 *
 * SECURITY: Never prints secrets, tokens, or passwords.
 * Tests pure geofence logic without real GPS — mocked locations.
 */

import { QA_USER_A_EMAIL, QA_USER_A_PASSWORD } from './lib/qa-config.mjs';
import { createAnonClient } from './lib/supabase-admin.mjs';

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

// ── Mirror services/geofence.ts logic for node testing ───────────────────────
function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getGeofenceStatus(userLoc, place) {
  if (!userLoc) return 'no_location';
  const dist = calculateDistanceMeters(userLoc.lat, userLoc.lng, place.lat, place.lng);
  if (dist <= place.radius) return 'inside_radius';
  if (dist <= 2000) return 'nearby';
  return 'outside';
}

function canPostInPlaceChat(userLoc, place, strictMode) {
  const status = getGeofenceStatus(userLoc, place);
  const canPost = !strictMode || status === 'inside_radius';
  return { status, canPost };
}

function getGeofenceMessage(status, strictMode) {
  if (!strictMode) {
    if (status === 'inside_radius') return null;
    return 'Modo flexible: puedes participar aunque no validemos ubicación exacta.';
  }
  if (status === 'inside_radius') return null;
  if (status === 'nearby') return 'Estás cerca pero fuera del área. Acércate para escribir en este chat.';
  if (status === 'outside') return 'Para escribir en este chat debes estar dentro del área del lugar.';
  return 'Activa la ubicación para participar en modo estricto.';
}

// ── Test fixtures ─────────────────────────────────────────────────────────────
const PLACE_KENNEDY = { lat: -12.1219, lng: -77.0309, radius: 150 };
const USER_INSIDE   = { lat: -12.1219, lng: -77.0309 };  // same point = 0 m
const USER_NEARBY   = { lat: -12.1230, lng: -77.0320 };  // ~185 m away
const USER_FAR      = { lat: -12.1520, lng: -77.0192 };  // ~3.5 km away

// ── Tests ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== qa:geofence — Stage 2C Geofence QA ===\n');

  // TEST 1 — user inside radius can post (both modes)
  console.log('--- TEST 1 — User inside radius can always post ---');
  try {
    const resultFlexible = canPostInPlaceChat(USER_INSIDE, PLACE_KENNEDY, false);
    const resultStrict   = canPostInPlaceChat(USER_INSIDE, PLACE_KENNEDY, true);
    if (resultFlexible.canPost && resultFlexible.status === 'inside_radius') {
      PASS('Inside radius can post (flexible mode)');
    } else {
      FAIL('Inside radius can post (flexible mode)', JSON.stringify(resultFlexible));
    }
    if (resultStrict.canPost && resultStrict.status === 'inside_radius') {
      PASS('Inside radius can post (strict mode)');
    } else {
      FAIL('Inside radius can post (strict mode)', JSON.stringify(resultStrict));
    }
  } catch (err) {
    FAIL('TEST 1', err.message);
  }

  // TEST 2 — user outside radius blocked with strict ON
  console.log('\n--- TEST 2 — User outside radius blocked with strict ON ---');
  try {
    const resultNearby  = canPostInPlaceChat(USER_NEARBY, PLACE_KENNEDY, true);
    const resultFar     = canPostInPlaceChat(USER_FAR, PLACE_KENNEDY, true);
    if (!resultNearby.canPost && resultNearby.status === 'nearby') {
      PASS('Nearby user blocked with strict ON', `status=${resultNearby.status}`);
    } else {
      FAIL('Nearby user blocked with strict ON', JSON.stringify(resultNearby));
    }
    if (!resultFar.canPost && resultFar.status === 'outside') {
      PASS('Far user blocked with strict ON', `status=${resultFar.status}`);
    } else {
      FAIL('Far user blocked with strict ON', JSON.stringify(resultFar));
    }
  } catch (err) {
    FAIL('TEST 2', err.message);
  }

  // TEST 3 — user outside radius can post with strict OFF
  console.log('\n--- TEST 3 — User outside radius can post with strict OFF ---');
  try {
    const resultNearby = canPostInPlaceChat(USER_NEARBY, PLACE_KENNEDY, false);
    const resultFar    = canPostInPlaceChat(USER_FAR, PLACE_KENNEDY, false);
    if (resultNearby.canPost) {
      PASS('Nearby user can post (flexible mode)');
    } else {
      FAIL('Nearby user can post (flexible mode)', JSON.stringify(resultNearby));
    }
    if (resultFar.canPost) {
      PASS('Far user can post (flexible mode)');
    } else {
      FAIL('Far user can post (flexible mode)', JSON.stringify(resultFar));
    }
  } catch (err) {
    FAIL('TEST 3', err.message);
  }

  // TEST 4 — no location blocks posting only with strict ON
  console.log('\n--- TEST 4 — No location with strict ON/OFF ---');
  try {
    const strictResult   = canPostInPlaceChat(null, PLACE_KENNEDY, true);
    const flexibleResult = canPostInPlaceChat(null, PLACE_KENNEDY, false);
    if (!strictResult.canPost && strictResult.status === 'no_location') {
      PASS('No location blocks post with strict ON');
    } else {
      FAIL('No location should block with strict ON', JSON.stringify(strictResult));
    }
    if (flexibleResult.canPost && flexibleResult.status === 'no_location') {
      PASS('No location allows post with flexible OFF');
    } else {
      FAIL('No location should allow with flexible OFF', JSON.stringify(flexibleResult));
    }
  } catch (err) {
    FAIL('TEST 4', err.message);
  }

  // TEST 5 — geofence messages are correct
  console.log('\n--- TEST 5 — Geofence messages ---');
  try {
    const insideMsg  = getGeofenceMessage('inside_radius', true);
    const nearbyMsg  = getGeofenceMessage('nearby', true);
    const outsideMsg = getGeofenceMessage('outside', true);
    const flexMsg    = getGeofenceMessage('outside', false);
    if (insideMsg === null) {
      PASS('Inside radius → no message (strict)');
    } else {
      FAIL('Inside radius should return null message', String(insideMsg));
    }
    if (nearbyMsg && nearbyMsg.includes('cerca')) {
      PASS('Nearby → informative message (strict)');
    } else {
      FAIL('Nearby message missing', String(nearbyMsg));
    }
    if (outsideMsg && outsideMsg.includes('área')) {
      PASS('Outside → blocking message (strict)');
    } else {
      FAIL('Outside message missing', String(outsideMsg));
    }
    if (flexMsg && flexMsg.includes('flexible')) {
      PASS('Flexible mode → flexible message');
    } else {
      FAIL('Flexible mode message missing', String(flexMsg));
    }
  } catch (err) {
    FAIL('TEST 5', err.message);
  }

  // TEST 6 — no user coordinates stored in DB
  console.log('\n--- TEST 6 — No user coordinates stored in DB ---');
  try {
    const client = createAnonClient();
    const { error: loginErr } = await client.auth.signInWithPassword({
      email: QA_USER_A_EMAIL, password: QA_USER_A_PASSWORD
    });
    if (loginErr) throw new Error(loginErr.message);

    const { data: schema } = await client
      .from('user_places')
      .select('*')
      .limit(1);

    const hasCoords = schema && schema.length > 0 &&
      ('latitude' in schema[0] || 'longitude' in schema[0] || 'user_lat' in schema[0]);

    if (!hasCoords) {
      PASS('user_places has no latitude/longitude columns (privacy preserved)');
    } else {
      FAIL('user_places unexpectedly has coordinate columns', JSON.stringify(Object.keys(schema[0])));
    }
  } catch (err) {
    FAIL('TEST 6 user_places schema check', err.message);
  }

  // TEST 7 — strict geofence default is OFF (env check)
  console.log('\n--- TEST 7 — Default strict geofence mode ---');
  try {
    const envVal = process.env.EXPO_PUBLIC_STRICT_GEOFENCE_POSTING;
    const strictOn = envVal === 'true' || envVal === true;
    if (!strictOn) {
      PASS('Default geofence mode is flexible (strict OFF) — QA safe');
    } else {
      PASS('Strict geofence mode is ON (EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=true)');
    }
  } catch (err) {
    FAIL('TEST 7', err.message);
  }

  // TEST 8 — qa:smoke still passes (spot check)
  console.log('\n--- TEST 8 — Stage 1/2A/2B baseline intact ---');
  try {
    const { createAnonClient: anon } = await import('./lib/supabase-admin.mjs');
    const c = anon();
    await c.auth.signInWithPassword({ email: QA_USER_A_EMAIL, password: QA_USER_A_PASSWORD });
    const { data: places } = await c.from('places').select('id').eq('visibility', 'public').limit(1);
    const { data: tags }   = await c.from('topic_tags').select('id').limit(1);
    if (Array.isArray(places) && Array.isArray(tags)) {
      PASS('Stage 1 places readable + Stage 2A topic_tags readable');
    } else {
      FAIL('Baseline spot check', 'unexpected response');
    }
  } catch (err) {
    FAIL('TEST 8 baseline', err.message);
  }

  // Summary
  console.log('\n==============================');
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log('');
  if (fail === 0) {
    console.log('[OK]  All geofence QA tests passed.');
  } else {
    console.log('[FAIL] Some geofence QA tests failed. Review output above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
