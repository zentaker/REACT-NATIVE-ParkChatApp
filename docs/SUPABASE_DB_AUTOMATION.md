# Supabase DB Automation — Aldea / ParkChat

Actualizado: 23-may-2026

## Resumen

Replit puede aplicar SQL administrativo al DB de Supabase **sin copiar SQL manualmente** y sin exponer secretos. La conexión TCP directa al DB es IPv6-only (bloqueada por Replit), así que se usa la **Supabase Management API** con un Personal Access Token.

---

## Secrets requeridos

| Secret | Propósito | Dónde obtenerlo |
|---|---|---|
| `SUPABASE_DB_PASSWORD` | Contraseña del DB (validación, no usada para conexión) | Supabase Dashboard → Project Settings → Database |
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token para Management API | https://supabase.com/dashboard/account/tokens |
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto (ya existía) | Supabase Dashboard → Project Settings → API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave anon pública (ya existía) | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio para admin auth (ya existía) | Supabase Dashboard → Project Settings → API |

### Reglas de seguridad

- **NUNCA** se imprimen contraseñas, tokens ni connection strings completos.
- **NUNCA** se usan prefijos `EXPO_PUBLIC_` para secrets del servidor.
- **NUNCA** se guardan secrets en archivos o se commitean al repo.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en `scripts/` — nunca en app code.
- `SUPABASE_ACCESS_TOKEN` solo se usa en `scripts/lib/supabase-db-url.mjs`.

---

## Arquitectura de conexión

```
Replit scripts
    │
    ├── scripts/lib/supabase-db-url.mjs   ← getManagementApiConfig() + executeSQL()
    │         │
    │         └── https://api.supabase.com/v1/projects/{ref}/database/query
    │                   │
    │                   └── SUPABASE_ACCESS_TOKEN (Bearer)
    │
    └── scripts/lib/supabase-admin.mjs    ← createAdminClient() (service_role)
              │
              └── https://{ref}.supabase.co (PostgREST + Auth Admin API)
                        │
                        └── SUPABASE_SERVICE_ROLE_KEY
```

**Nota:** La conexión TCP directa (`db.{ref}.supabase.co:5432`) es IPv6-only y está bloqueada en Replit. El pooler de Supabase tampoco está habilitado para este proyecto. Se usa la Management API como workaround estable.

---

## Scripts disponibles

```bash
npm run supabase:doctor-db        # Valida todos los secrets y la conexión
npm run supabase:apply:policies   # Aplica supabase/policies.sql
npm run supabase:apply:triggers   # Aplica supabase/triggers.sql
npm run supabase:apply:seed       # Aplica supabase/seed.sql
npm run supabase:apply:all        # Aplica triggers → policies → seed
```

### Flujo de aplicación recomendado

```bash
npm run supabase:doctor-db        # 1. Validar secrets
npm run supabase:apply:all        # 2. Aplicar todo
npm run qa:seed                   # 3. Crear usuarios QA + seed via service_role
npm run qa:smoke                  # 4. Validar RLS y funcionalidad completa
```

---

## Archivos SQL gestionados

| Archivo | Propósito | Idempotente |
|---|---|---|
| `supabase/schema.sql` | Schema completo (para proyectos nuevos) | Sí (`IF NOT EXISTS`) |
| `supabase/policies.sql` | RLS policies para las 9 tablas | Sí (`DROP POLICY IF EXISTS`) |
| `supabase/triggers.sql` | Triggers (`set_updated_at`, `handle_new_user`) | Sí (`CREATE OR REPLACE`) |
| `supabase/seed.sql` | Datos de demo (places, groups, events) | Sí (`ON CONFLICT DO UPDATE`) |

**`schema.sql` NO se incluye en `--all`** porque las tablas ya existen en el DB real.

---

## Estado de aplicación (23-may-2026)

| Archivo | Estado | Resultado |
|---|---|---|
| `supabase/policies.sql` | ✅ Aplicado | 33 políticas activas en 9 tablas |
| `supabase/triggers.sql` | ✅ Aplicado | `set_updated_at` + `handle_new_user` |
| `supabase/seed.sql` | ✅ Aplicado | 4 places, 5 groups, 4 events |

---

## Correcciones de schema aplicadas

El DB real de Supabase difería del `schema.sql` original:

| Tabla | Columna vieja (schema.sql) | Columna real (DB) |
|---|---|---|
| `places` | `category` | `type` |
| `places` | `district` | `country` |
| `places` | — | `radius_meters`, `created_by`, `updated_at` |
| `groups` | `visibility` | `access_level` |
| `groups` | — | `member_count`, `updated_at` |
| `reports` | `target_type`, `target_id` | `reported_user_id`, `place_id`, `message_id`, `group_id`, `event_id` |
| `profiles` | `is_moderator` (boolean) | `role` (text: 'user'\|'moderator'\|'admin') |

Los servicios del app code (`services/moderation.ts`, `services/groups.ts`) fueron corregidos para usar el schema real.
