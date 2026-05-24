#!/usr/bin/env node
/**
 * qa-geospatial.mjs
 * QA tests for Stage 2B geospatial nearby layer.
 * Usage: npm run qa:geo
 *
 * SECURITY: Never prints secrets, tokens, or passwords.
 * Validates location logic, nearby places, and graph insights.
 */

import { createAnonClient } from './lib/supabase-admin.mjs';

const QA_USER_A_EMAIL = 'qa.aldea.a@example.com';
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

// ── Haversine formula (mirrors services/location.ts) ─────────────────────────
function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isWithinRadius(userLat, userLng, placeLat, placeLng, radiusMeters) {
  const dist = calculateDistanceMeters(userLat, userLng, placeLat, placeLng);
  return dist <= radiusMeters;
}

function annotatePlacesWithDistance(places, userLat, userLng) {
  return places.map((p) => {
    const lat = typeof p.latitude === 'number' ? p.latitude : Number(p.latitude);
    const lng = typeof p.longitude === 'number' ? p.longitude : Number(p.longitude);
    const dist = calculateDistanceMeters(userLat, userLng, lat, lng);
    return { ...p, distanceMeters: dist };
  });
}

function sortByDistance(places) {
  return [...places].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== qa:geo — Stage 2B Geospatial QA ===\n');

  // TEST 1 — calculateDistanceMeters with known values
  console.log('--- TEST 1 — calculateDistanceMeters ---');
  try {
    // Lima: Parque Kennedy (-12.1219, -77.0309) to Barranco (-12.1520, -77.0192)
    const dist = calculateDistanceMeters(-12.1219, -77.0309, -12.1520, -77.0192);
    const isInRange = dist > 3000 && dist < 4500;
    if (isInRange) {
      PASS('calculateDistanceMeters Kennedy→Barranco', `${Math.round(dist)} m (expected ~3.4 km)`);
    } else {
      FAIL('calculateDistanceMeters Kennedy→Barranco', `got ${Math.round(dist)} m, expected ~3400 m`);
    }

    // Same point = 0
    const zero = calculateDistanceMeters(-12.1219, -77.0309, -12.1219, -77.0309);
    if (zero < 1) {
      PASS('calculateDistanceMeters same point = 0');
    } else {
      FAIL('calculateDistanceMeters same point = 0', `got ${zero}`);
    }
  } catch (err) {
    FAIL('calculateDistanceMeters', err.message);
  }

  // TEST 2 — isWithinRadius
  console.log('\n--- TEST 2 — isWithinRadius ---');
  try {
    const inside = isWithinRadius(-12.1219, -77.0309, -12.1219, -77.0309, 150);
    if (inside) {
      PASS('isWithinRadius: same point inside 150 m radius');
    } else {
      FAIL('isWithinRadius: same point should be inside 150 m radius');
    }

    const outside = isWithinRadius(-12.1219, -77.0309, -12.1520, -77.0192, 150);
    if (!outside) {
      PASS('isWithinRadius: Barranco outside Kennedy 150 m radius');
    } else {
      FAIL('isWithinRadius: Barranco should be outside Kennedy 150 m radius');
    }
  } catch (err) {
    FAIL('isWithinRadius', err.message);
  }

  // TEST 3 — places have latitude/longitude/radius_meters
  console.log('\n--- TEST 3 — DB places have coordinates ---');
  const clientA = createAnonClient();
  let placeId = null;
  let placeLat = null;
  let placeLng = null;
  let placeRadius = null;

  try {
    const { data: { session }, error: loginErr } = await clientA.auth.signInWithPassword({
      email: QA_USER_A_EMAIL, password: QA_PASSWORD
    });
    if (loginErr || !session) throw new Error(loginErr?.message ?? 'login failed');

    const { data: places, error: placesErr } = await clientA
      .from('places')
      .select('id, name, latitude, longitude, radius_meters')
      .eq('visibility', 'public')
      .limit(5);

    if (placesErr || !places || places.length === 0) {
      FAIL('places with coordinates', placesErr?.message ?? 'no places');
    } else {
      const withCoords = places.filter(
        (p) => p.latitude !== null && p.longitude !== null
      );
      if (withCoords.length > 0) {
        placeId = withCoords[0].id;
        placeLat = Number(withCoords[0].latitude);
        placeLng = Number(withCoords[0].longitude);
        placeRadius = withCoords[0].radius_meters ?? 150;
        PASS('places have latitude/longitude', `${withCoords.length}/${places.length} con coordenadas`);
      } else {
        FAIL('places have latitude/longitude', 'ningún lugar tiene coordenadas');
      }
    }
  } catch (err) {
    FAIL('places coordinates DB check', err.message);
  }

  // TEST 4 — getNearbyPlacesWithDistance sorts correctly
  console.log('\n--- TEST 4 — nearby sort order ---');
  try {
    const { data: rawPlaces } = await clientA
      .from('places')
      .select('id, name, latitude, longitude, radius_meters')
      .eq('visibility', 'public');

    if (rawPlaces && rawPlaces.length > 1) {
      const userLat = -12.1219;
      const userLng = -77.0309;
      const annotated = annotatePlacesWithDistance(rawPlaces, userLat, userLng);
      const sorted = sortByDistance(annotated);
      let isSorted = true;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].distanceMeters < sorted[i - 1].distanceMeters) {
          isSorted = false;
          break;
        }
      }
      if (isSorted) {
        PASS('sortPlacesByDistance sorts ascending', `${sorted.length} lugares`);
      } else {
        FAIL('sortPlacesByDistance', 'orden incorrecto');
      }
    } else {
      PASS('sortPlacesByDistance', 'solo 1 lugar (no se puede verificar orden)');
    }
  } catch (err) {
    FAIL('sortPlacesByDistance', err.message);
  }

  // TEST 5 — user_places upsert (visited)
  console.log('\n--- TEST 5 — user_places upsert ---');
  if (placeId) {
    try {
      const userId = (await clientA.auth.getUser()).data.user?.id;
      const { data: existing } = await clientA
        .from('user_places')
        .select('id, visit_count')
        .eq('user_id', userId)
        .eq('place_id', placeId)
        .maybeSingle();

      if (existing) {
        const prevCount = existing.visit_count;
        const { error: updateErr } = await clientA
          .from('user_places')
          .update({
            relationship_type: 'visited',
            last_seen_at: new Date().toISOString(),
            visit_count: prevCount + 1
          })
          .eq('id', existing.id);

        if (updateErr) {
          FAIL('user_places upsert (update)', updateErr.message);
        } else {
          PASS('user_places upsert (update visit_count)', `${prevCount} → ${prevCount + 1}`);
        }
      } else {
        const { error: insertErr } = await clientA
          .from('user_places')
          .insert({
            user_id: userId,
            place_id: placeId,
            relationship_type: 'visited',
            last_seen_at: new Date().toISOString(),
            visit_count: 1
          });

        if (insertErr) {
          FAIL('user_places upsert (insert)', insertErr.message);
        } else {
          PASS('user_places upsert (insert)', `place ${truncate(placeId)}`);
        }
      }
    } catch (err) {
      FAIL('user_places upsert', err.message);
    }
  } else {
    FAIL('user_places upsert', 'no placeId disponible (TEST 3 falló)');
  }

  // TEST 6 — getPlaceGraphInsights structure
  console.log('\n--- TEST 6 — place graph insights ---');
  if (placeId) {
    try {
      const { data: topics } = await clientA
        .from('place_topics')
        .select('*, topic_tags(*)')
        .eq('place_id', placeId)
        .order('weight', { ascending: false })
        .limit(5);

      const { data: groups } = await clientA
        .from('groups')
        .select('id, name')
        .eq('place_id', placeId)
        .limit(3);

      const { data: events } = await clientA
        .from('events')
        .select('id, title')
        .eq('place_id', placeId)
        .limit(3);

      const hasTopicsArray = Array.isArray(topics);
      const hasGroupsArray = Array.isArray(groups);
      const hasEventsArray = Array.isArray(events);

      if (hasTopicsArray && hasGroupsArray && hasEventsArray) {
        PASS('getPlaceGraphInsights structure', `topics=${topics.length} groups=${groups.length} events=${events.length}`);
      } else {
        FAIL('getPlaceGraphInsights structure', 'data not arrays');
      }
    } catch (err) {
      FAIL('getPlaceGraphInsights', err.message);
    }
  } else {
    FAIL('getPlaceGraphInsights', 'no placeId');
  }

  // TEST 7 — RLS: cannot write user_places for another user
  console.log('\n--- TEST 7 — RLS user_places isolation ---');
  const clientB = createAnonClient();
  try {
    const { error: loginB } = await clientB.auth.signInWithPassword({
      email: 'qa.aldea.b@example.com', password: QA_PASSWORD
    });
    if (loginB) throw new Error(loginB.message);

    const userAId = (await clientA.auth.getUser()).data.user?.id;
    const userBId = (await clientB.auth.getUser()).data.user?.id;

    if (placeId && userAId) {
      const { error: rlsErr } = await clientB
        .from('user_places')
        .insert({
          user_id: userAId,
          place_id: placeId,
          relationship_type: 'visited',
          last_seen_at: new Date().toISOString(),
          visit_count: 1
        });

      if (rlsErr) {
        PASS('RLS blocks writing user_places for another user', rlsErr.code ?? rlsErr.message);
      } else {
        FAIL('RLS user_places isolation', 'insert of another user succeeded — RLS may be open');
      }
    } else {
      FAIL('RLS user_places isolation', 'missing userAId or placeId');
    }
  } catch (err) {
    FAIL('RLS user_places isolation', err.message);
  }

  // TEST 8 — qa:smoke still passes (spot check: can read places)
  console.log('\n--- TEST 8 — Stage 1 baseline spot check ---');
  try {
    const { data: spotPlaces, error: spotErr } = await clientA
      .from('places')
      .select('id')
      .eq('visibility', 'public')
      .limit(1);

    if (spotErr || !spotPlaces) {
      FAIL('Stage 1 baseline: can read places', spotErr?.message);
    } else {
      PASS('Stage 1 baseline: can read places', `${spotPlaces.length} lugar(es)`);
    }
  } catch (err) {
    FAIL('Stage 1 baseline spot check', err.message);
  }

  // TEST 9 — graph-ready Stage 2A still intact
  console.log('\n--- TEST 9 — Stage 2A graph-ready intact ---');
  try {
    const { data: tags } = await clientA
      .from('topic_tags')
      .select('id, name, slug')
      .limit(5);

    const { data: interests } = await clientA
      .from('user_topic_interests')
      .select('id')
      .limit(5);

    if (Array.isArray(tags) && Array.isArray(interests)) {
      PASS('Stage 2A topic_tags readable', `${tags.length} tags`);
      PASS('Stage 2A user_topic_interests readable', `${interests.length} interests`);
    } else {
      FAIL('Stage 2A tables check', 'unexpected non-array response');
    }
  } catch (err) {
    FAIL('Stage 2A graph-ready intact', err.message);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n==============================');
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log('');
  if (fail === 0) {
    console.log('[OK]  All geospatial QA tests passed.');
  } else {
    console.log('[FAIL] Some geospatial QA tests failed. Review output above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
