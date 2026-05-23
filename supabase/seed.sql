insert into public.places (
  id,
  name,
  description,
  category,
  city,
  district,
  latitude,
  longitude,
  visibility
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'Parque Kennedy',
    'Un punto vivo de Miraflores para conversaciones, ferias, mascotas y encuentros espontaneos.',
    'park',
    'Lima',
    'Miraflores',
    -12.1211,
    -77.0297,
    'public'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Barranco Plaza',
    'Plaza barranquina con energia cultural, caminatas, musica y comunidad de barrio.',
    'plaza',
    'Lima',
    'Barranco',
    -12.1491,
    -77.0216,
    'public'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Cafe Cultural Miraflores',
    'Cafe para freelancers, idiomas, lectura compartida y microeventos culturales.',
    'cafe',
    'Lima',
    'Miraflores',
    -12.1228,
    -77.0284,
    'public'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Coworking Creativo',
    'Espacio de trabajo con comunidad de nomadas digitales, diseno y tecnologia local.',
    'coworking',
    'Lima',
    'Miraflores',
    -12.1197,
    -77.0251,
    'public'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  city = excluded.city,
  district = excluded.district,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  visibility = excluded.visibility;

do $$
declare
  seed_user_id uuid;
begin
  select id into seed_user_id
  from public.profiles
  order by created_at asc
  limit 1;

  if seed_user_id is null then
    raise notice 'Skipping group/event seed rows because no authenticated profile exists yet.';
  else
    insert into public.groups (
      id,
      place_id,
      name,
      description,
      created_by,
      visibility
    ) values
      (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
        '11111111-1111-4111-8111-111111111111',
        'Club de conversacion japonesa',
        'Practica informal de japones en espacios abiertos y seguros.',
        seed_user_id,
        'public'
      ),
      (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
        '11111111-1111-4111-8111-111111111111',
        'Skaters del parque',
        'Puntos de practica, horarios y apoyo para principiantes.',
        seed_user_id,
        'public'
      ),
      (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
        '11111111-1111-4111-8111-111111111111',
        'Lectura al aire libre',
        'Lecturas sabatinas, intercambio de libros y cafe cercano.',
        seed_user_id,
        'public'
      ),
      (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
        '44444444-4444-4444-8444-444444444444',
        'Nomadas digitales',
        'Comunidad local para trabajo remoto, cafes y colaboraciones.',
        seed_user_id,
        'public'
      ),
      (
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
        '22222222-2222-4222-8222-222222222222',
        'Comunidad queer segura',
        'Grupo con moderacion activa y normas claras de cuidado.',
        seed_user_id,
        'public'
      )
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      visibility = excluded.visibility;

    insert into public.events (
      id,
      place_id,
      group_id,
      title,
      description,
      starts_at,
      ends_at,
      created_by
    ) values
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
        '11111111-1111-4111-8111-111111111111',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
        'Picnic de conversacion',
        'Mesa tranquila para practicar japones y conocer gente del parque.',
        '2026-05-24T22:00:00.000Z',
        '2026-05-25T00:00:00.000Z',
        seed_user_id
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
        '22222222-2222-4222-8222-222222222222',
        null,
        'Caminata grupal',
        'Ruta corta por Barranco, pensada para llegar y volver en grupo.',
        '2026-05-25T21:30:00.000Z',
        '2026-05-25T23:00:00.000Z',
        seed_user_id
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
        '11111111-1111-4111-8111-111111111111',
        null,
        'Intercambio cultural',
        'Conversaciones por mesas: idiomas, musica, comida y viajes.',
        '2026-05-26T22:30:00.000Z',
        null,
        seed_user_id
      ),
      (
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
        '33333333-3333-4333-8333-333333333333',
        null,
        'Cafe de freelancers',
        'Encuentro ligero para compartir proyectos y pedir feedback.',
        '2026-05-27T16:00:00.000Z',
        '2026-05-27T18:00:00.000Z',
        seed_user_id
      )
    on conflict (id) do update set
      title = excluded.title,
      description = excluded.description,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at;
  end if;
end $$;
