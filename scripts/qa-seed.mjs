#!/usr/bin/env node
/**
 * qa-seed.mjs
 * Inserts seed places and creates confirmed QA users using service_role.
 * Server-only — never run from the browser or import from app code.
 *
 * Uses the ACTUAL Supabase DB schema (discovered via OpenAPI):
 *   places: id, name, description, type, latitude, longitude, radius_meters,
 *           city, country, visibility, created_by, created_at, updated_at
 *   groups: id, place_id, created_by, name, description, access_level,
 *           member_count, created_at, updated_at
 *   events: id, place_id, group_id, created_by, title, description,
 *           starts_at, ends_at, capacity, access_level, source_type,
 *           source_message_id, created_at, updated_at
 *
 * QA users: qa.aldea.a@example.com / qa.aldea.b@example.com
 * Password: fixed QA-only dummy (Ald3aQA!2026) — not a production secret.
 */

import { createAdminClient } from './lib/supabase-admin.mjs';

const QA_PASSWORD = 'Ald3aQA!2026';

const QA_USERS = [
  { email: 'qa.aldea.a@example.com', display_name: 'QA_UserA' },
  { email: 'qa.aldea.b@example.com', display_name: 'QA_UserB' },
];

function buildSeedPlaces(createdBy) {
  return [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Parque Kennedy',
      description: 'Un punto vivo de Miraflores para conversaciones, ferias, mascotas y encuentros espontaneos.',
      type: 'park',
      city: 'Lima',
      country: 'Peru',
      latitude: -12.1211,
      longitude: -77.0297,
      radius_meters: 150,
      visibility: 'public',
      created_by: createdBy,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Barranco Plaza',
      description: 'Plaza barranquina con energia cultural, caminatas, musica y comunidad de barrio.',
      type: 'plaza',
      city: 'Lima',
      country: 'Peru',
      latitude: -12.1491,
      longitude: -77.0216,
      radius_meters: 150,
      visibility: 'public',
      created_by: createdBy,
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Cafe Cultural Miraflores',
      description: 'Cafe para freelancers, idiomas, lectura compartida y microeventos culturales.',
      type: 'cafe',
      city: 'Lima',
      country: 'Peru',
      latitude: -12.1228,
      longitude: -77.0284,
      radius_meters: 100,
      visibility: 'public',
      created_by: createdBy,
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Coworking Creativo',
      description: 'Espacio de trabajo con comunidad de nomadas digitales, diseno y tecnologia local.',
      type: 'coworking',
      city: 'Lima',
      country: 'Peru',
      latitude: -12.1197,
      longitude: -77.0251,
      radius_meters: 100,
      visibility: 'public',
      created_by: createdBy,
    },
  ];
}

function buildSeedGroups(createdBy) {
  return [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      place_id: '11111111-1111-4111-8111-111111111111',
      name: 'Club de conversacion japonesa',
      description: 'Practica informal de japones en espacios abiertos y seguros.',
      created_by: createdBy,
      access_level: 'public',
      member_count: 0,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      place_id: '11111111-1111-4111-8111-111111111111',
      name: 'Skaters del parque',
      description: 'Puntos de practica, horarios y apoyo para principiantes.',
      created_by: createdBy,
      access_level: 'public',
      member_count: 0,
    },
  ];
}

function buildSeedEvents(createdBy) {
  return [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      place_id: '11111111-1111-4111-8111-111111111111',
      group_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      title: 'Picnic de conversacion',
      description: 'Mesa tranquila para practicar japones y conocer gente del parque.',
      starts_at: '2026-05-24T22:00:00.000Z',
      ends_at: '2026-05-25T00:00:00.000Z',
      created_by: createdBy,
      access_level: 'public',
      source_type: 'group',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      place_id: '22222222-2222-4222-8222-222222222222',
      group_id: null,
      title: 'Caminata grupal',
      description: 'Ruta corta por Barranco, pensada para llegar y volver en grupo.',
      starts_at: '2026-05-25T21:30:00.000Z',
      ends_at: '2026-05-25T23:00:00.000Z',
      created_by: createdBy,
      access_level: 'public',
      source_type: 'place',
    },
  ];
}

async function ensureQAUsers(admin) {
  console.log('\n--- SEED: QA users ---');
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.log('[FAIL] Could not list users:', listErr.message);
    return [];
  }

  const results = [];
  for (const user of QA_USERS) {
    const existing = listData.users.find(u => u.email === user.email);

    if (existing) {
      console.log('[SKIP] ' + user.email + ' already exists (id=' + existing.id.slice(0, 8) + '...)');
      results.push({ email: user.email, id: existing.id, ok: true });
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: user.email,
        password: QA_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: user.display_name },
      });

      if (createErr) {
        console.log('[FAIL] Could not create ' + user.email + ': ' + createErr.message);
        results.push({ email: user.email, ok: false });
        continue;
      }
      console.log('[OK]  Created ' + user.email + ' (id=' + created.user.id.slice(0, 8) + '...) — confirmed');
      results.push({ email: user.email, id: created.user.id, ok: true });
    }

    const last = results[results.length - 1];
    if (last.ok && last.id) {
      const { data: profile } = await admin.from('profiles').select('id,display_name').eq('id', last.id).maybeSingle();
      if (!profile) {
        const { error: upsertErr } = await admin.from('profiles').upsert(
          { id: last.id, display_name: user.display_name },
          { onConflict: 'id' }
        );
        if (upsertErr) {
          console.log('[WARN] Profile upsert failed for ' + user.email + ': ' + upsertErr.message);
        } else {
          console.log('[OK]  Profile upserted for ' + user.email);
        }
      } else {
        console.log('[OK]  Profile exists for ' + user.email + ' (display_name=' + profile.display_name + ')');
      }
    }
  }
  return results;
}

async function seedPlaces(admin, createdBy) {
  console.log('\n--- SEED: places ---');
  const { count } = await admin.from('places').select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log('[SKIP] places already has ' + count + ' rows — no duplicates inserted');
    return true;
  }

  const places = buildSeedPlaces(createdBy);
  const { error } = await admin.from('places').upsert(places, { onConflict: 'id' });
  if (error) {
    console.log('[FAIL] Could not insert places:', error.message);
    return false;
  }
  console.log('[OK]  Inserted ' + places.length + ' places');
  places.forEach(p => console.log('      - ' + p.name + ' (' + p.city + ', type=' + p.type + ')'));
  return true;
}

async function seedGroups(admin, createdBy) {
  console.log('\n--- SEED: groups ---');
  const { count } = await admin.from('groups').select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log('[SKIP] groups already has ' + count + ' rows');
    return true;
  }

  const groups = buildSeedGroups(createdBy);
  const { error } = await admin.from('groups').upsert(groups, { onConflict: 'id' });
  if (error) {
    console.log('[FAIL] Could not insert groups:', error.message);
    return false;
  }
  console.log('[OK]  Inserted ' + groups.length + ' groups');
  return true;
}

async function seedEvents(admin, createdBy) {
  console.log('\n--- SEED: events ---');
  const { count } = await admin.from('events').select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log('[SKIP] events already has ' + count + ' rows');
    return true;
  }

  const events = buildSeedEvents(createdBy);
  const { error } = await admin.from('events').upsert(events, { onConflict: 'id' });
  if (error) {
    console.log('[FAIL] Could not insert events:', error.message);
    return false;
  }
  console.log('[OK]  Inserted ' + events.length + ' events');
  return true;
}

async function run() {
  console.log('Aldea / ParkChat — QA Seed');
  console.log('===========================');

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.log('[FAIL] Could not create admin client:', e.message);
    process.exit(1);
  }

  // 1. Create QA users first (need their IDs for created_by on places/groups/events)
  const userResults = await ensureQAUsers(admin);
  const firstUser = userResults.find(u => u.ok && u.id);
  if (!firstUser) {
    console.log('[FAIL] No QA user available — cannot seed places/groups/events.');
    process.exit(1);
  }

  // 2. Seed places, groups, events
  const placesOk = await seedPlaces(admin, firstUser.id);
  const groupsOk = await seedGroups(admin, firstUser.id);
  const eventsOk = await seedEvents(admin, firstUser.id);

  console.log('\n--- SUMMARY ---');
  userResults.forEach(u => console.log('user ' + u.email + ': ' + (u.ok ? 'OK' : 'FAIL')));
  console.log('places: ' + (placesOk ? 'OK' : 'FAIL'));
  console.log('groups: ' + (groupsOk ? 'OK' : 'FAIL'));
  console.log('events: ' + (eventsOk ? 'OK' : 'FAIL'));

  const allOk = userResults.every(u => u.ok) && placesOk && groupsOk && eventsOk;
  if (!allOk) {
    console.log('\n[FAIL] Seed incomplete. Fix errors above before running qa-smoke.mjs.');
    process.exit(1);
  }

  console.log('\n[OK]  Seed complete. Ready for qa-smoke.mjs.');
}

run().catch(e => {
  console.error('[FATAL]', e.message);
  process.exit(1);
});
