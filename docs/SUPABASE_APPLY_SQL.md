# Aplicacion de SQL en Supabase

Guia operativa para dejar el backend de Aldea / ParkChat listo en un proyecto
Supabase nuevo (o ya existente sin esquema). El agente NO ejecuta esto desde
Replit: lo corres tu desde el SQL Editor del dashboard.

## Orden exacto

Ejecuta los archivos en este orden, uno por uno, en el **SQL Editor** del
proyecto Supabase (Dashboard -> SQL -> New query). Cada archivo es idempotente:
puedes re-ejecutarlo sin romper datos existentes.

1. `supabase/schema.sql`
   - Crea tablas: `profiles`, `places`, `place_messages`, `groups`,
     `group_members`, `events`, `event_rsvps`, `reports`, `blocks`.
   - Crea indices recomendados.
   - Crea funcion/trigger `handle_new_user` (auto-crea profile al registrarse).
   - Agrega `place_messages` a la publicacion `supabase_realtime` si existe.

2. `supabase/profiles-trigger.sql` (opcional)
   - Re-aplica solo el trigger de auto-creacion de profile.
   - Util si borraste el trigger desde la UI o necesitas reinstalarlo sin
     correr todo el esquema.

3. `supabase/triggers.sql`
   - Trigger `enforce_place_message_rate_limit` (5 msg / 60s + sin duplicado
     consecutivo). Cliente y servidor comparten regla.
   - Indice `place_messages_user_created_idx` de soporte.

4. `supabase/policies.sql`
   - Activa Row Level Security (RLS) en todas las tablas anteriores.
   - Crea policies por tabla (lectura publica donde aplica, insert/update
     restringido al `auth.uid()` del actor).

5. `supabase/seed.sql` (opcional)
   - Inserta places de ejemplo (Parque Kennedy, Barranco Plaza, etc.) para
     poder ver lugares reales en la app sin tener que crearlos a mano.
   - Si no quieres seed, saltalo. La app igual rendea (vacia o con tus
     propios places).

## Verificaciones rapidas

### 1. Las tablas existen

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Debe listar al menos: `blocks`, `event_rsvps`, `events`, `group_members`,
`groups`, `place_messages`, `places`, `profiles`, `reports`.

### 2. RLS esta activo

```sql
select relname as table, relrowsecurity as rls_on
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by relname;
```

Toda fila con `rls_on = false` necesita que vuelvas a correr `policies.sql`.

### 3. Realtime publica `place_messages`

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public';
```

Tiene que aparecer `place_messages`. Si no aparece:

```sql
alter publication supabase_realtime add table public.place_messages;
```

### 4. Trigger de profile auto-creado

```sql
select tgname, tgenabled
from pg_trigger
where tgrelid = 'auth.users'::regclass;
```

Debe existir `on_auth_user_created` con `tgenabled = 'O'` (origen, activo).

### 5. Seed cargo (si corriste seed.sql)

```sql
select id, name, city from public.places order by name;
```

## Errores comunes

| Sintoma | Causa probable | Fix |
|---|---|---|
| `permission denied for table profiles` al registrarse | Falta el trigger `handle_new_user` o el `security definer` | Re-aplica `profiles-trigger.sql` |
| `new row violates row-level security policy` al enviar mensaje | Policy de insert exige `auth.uid() = user_id` y el cliente esta mandando otro | Verifica que el cliente este autenticado y que el insert use `auth.uid()` |
| Mensajes no llegan en realtime al segundo cliente | `place_messages` no esta en `supabase_realtime` | Corre el `alter publication ... add table` de arriba |
| `duplicate key value violates unique constraint "profiles_pkey"` | Reintento de signup despues de borrar profile pero no auth.user | Borra tambien el usuario en `auth.users` o usa otro email |
| `rate_limit_exceeded:` al enviar mensaje | Trigger anti-spam disparado | Esperado: limite es 5 mensajes / 60s por usuario por lugar |
| `duplicate_message:` al enviar mensaje | Trigger anti-spam disparado | Esperado: bloquea el mismo cuerpo consecutivo del mismo usuario |

## Si una policy bloquea inserts validos

1. NO uses `service_role` en el cliente.
2. Aisla el caso en SQL Editor con `set role authenticated;` + `select set_config('request.jwt.claims', ...);` para simular un usuario.
3. Revisa la policy con `select * from pg_policies where tablename = '...';`.
4. Ajusta `policies.sql` en el repo, vuelve a aplicar el archivo completo (es
   idempotente: `drop policy if exists ... ; create policy ...`).
5. Documenta el cambio en `docs/RLS_CHECKLIST.md`.
