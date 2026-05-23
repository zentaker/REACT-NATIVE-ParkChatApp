# Estado actual en Replit

Snapshot del workspace al 23-may-2026.

## Identificacion
- **Proyecto:** Aldea / ParkChat
- **Branch:** `main`
- **Origen GitHub:** `zentaker/REACT-NATIVE-ParkChatApp`
- **Workspace:** Replit

## Workflow
- `Start application` → `bash scripts/start-web.sh` (Metro puerto 5000 + proxy 8081)
- Estado: **running**
- Preview URL: `https://50b81fc1-2e35-482d-9b2f-19cab751220c-00-1cjkyqq5duxei.worf.replit.dev/`

## Validaciones

| Check | Estado |
|---|---|
| `npm run doctor:node` | ✅ OK — URL válida, anon key presente, backend real activo |
| `npm run typecheck` | ✅ OK — 0 errores |
| `npm run supabase:doctor-db` | ✅ OK — 10/10 checks (secrets, Management API, SQL execution) |
| `npm run supabase:apply:policies` | ✅ OK — 33 políticas RLS aplicadas |
| `npm run supabase:apply:triggers` | ✅ OK |
| `npm run supabase:apply:seed` | ✅ OK — 4 places, 5 groups, 4 events |
| `npm run qa:seed` | ✅ OK — QA users + profiles + seed data |
| `npm run qa:smoke` | ✅ **23/23 PASS** — auth, places, chat, reports, blocks, groups, events, RLS |

## Secrets configurados

| Secret | Estado |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Presente |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Presente (len=208) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Presente (len=219) — solo scripts/ |
| `SUPABASE_DB_PASSWORD` | ✅ Presente (len=16) — documentación/validación |
| `SUPABASE_ACCESS_TOKEN` | ✅ Presente (len=44) — Management API |

**Ningún secret se usa en app code / frontend.**

## Supabase DB — Schema real

Proyecto: `apcdhwqfntujcwsbtfbu` | Región: `sa-east-1` | PG: 17.6

| Tabla | Estado | Notas |
|---|---|---|
| `profiles` | ✅ | `role` text (no `is_moderator` bool) |
| `places` | ✅ | `type`, `country`, `radius_meters`, `created_by` |
| `place_messages` | ✅ | Publicada en `supabase_realtime` |
| `groups` | ✅ | `access_level` (no `visibility`) |
| `group_members` | ✅ | PK `id` + unique(group_id,user_id) |
| `events` | ✅ | `access_level`, `source_type`, `source_message_id` |
| `event_rsvps` | ✅ | PK `id` + unique(event_id,user_id) |
| `reports` | ✅ | Columnas FK por tipo (no `target_type`/`target_id`) |
| `blocks` | ✅ | PK `id` + unique(blocker_id,blocked_id) |

## Próximo stage

**Etapa 1D — Release QA y preparación v0.1.0**

Pendiente:
- Validación de Realtime en browser (manual)
- Test de geofencing
- Moderación end-to-end
- Tag `v0.1.0`
