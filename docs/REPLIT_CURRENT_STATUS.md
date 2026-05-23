# Estado actual en Replit

Snapshot del workspace al 23-may-2026. **Etapa 1D — Release QA completa.**

## Identificacion

- **Proyecto:** Aldea / ParkChat
- **Branch:** `main`
- **Origen GitHub:** `zentaker/REACT-NATIVE-ParkChatApp`
- **Workspace:** Replit
- **Checkpoint:** `56f6dcab3f851370da117170d6a5148358598891`

## Workflow

- `Start application` → `bash scripts/start-web.sh` (Metro puerto 5000 + proxy 8081)
- Estado: **running**
- Preview URL: `https://50b81fc1-2e35-482d-9b2f-19cab751220c-00-1cjkyqq5duxei.worf.replit.dev/`

## Validaciones finales (Etapa 1D)

| Check | Estado | Resultado |
|---|---|---|
| `npm run doctor:node` | ✅ OK | URL válida, anon key presente, backend real activo |
| `npm run typecheck` | ✅ OK | 0 errores TypeScript |
| `npm run supabase:doctor-db` | ✅ OK | 10/10 checks (secrets, Management API, SQL) |
| `npm run qa:seed` | ✅ OK | QA users + profiles + seed data |
| `npm run qa:smoke` | ✅ **23/23 PASS** | auth, places, chat, reports, blocks, groups, events, RLS |
| `npm run lint` | — N/A | Script no existe — deferred |
| `npm run test` | — N/A | Script no existe — deferred |

## Secrets configurados en Replit

| Secret | Estado | Uso |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Presente | Frontend (Expo) — público |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Presente (len=208) | Frontend (Expo) — público |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Presente (len=219) | Solo `scripts/` — NUNCA en app code |
| `SUPABASE_DB_PASSWORD` | ✅ Presente (len=16) | Solo validación en `scripts/` |
| `SUPABASE_ACCESS_TOKEN` | ✅ Presente (len=44) | Management API en `scripts/` |

**Ningún secret usa prefijo `EXPO_PUBLIC_` salvo los intencionalmente públicos.**

## Supabase DB — Estado actual

Proyecto: `apcdhwqfntujcwsbtfbu` | Región: `sa-east-1` | PG: 17.6

| Componente | Estado | Detalle |
|---|---|---|
| Tablas (9) | ✅ | profiles, places, place_messages, groups, group_members, events, event_rsvps, reports, blocks |
| RLS en todas | ✅ | `rowsecurity=true` confirmado en 9 tablas |
| RLS policies (33) | ✅ | Aplicadas via Management API |
| Trigger `handle_new_user` | ✅ | Crea profile automáticamente al registro |
| Trigger `set_updated_at` | ✅ | |
| Trigger `place_messages_rate_limit` | ✅ | BEFORE INSERT — 5 msgs/60s + duplicate check |
| Realtime (`supabase_realtime`) | ✅ | place_messages, group_members, event_rsvps, reports |
| Seed | ✅ | 4 places, 5+ groups, 4+ events |
| QA_UserA | ✅ | `ef1489ce...`, `role=moderator` |
| QA_UserB | ✅ | `074afbbd...`, `role=user` |

## Usuarios QA

| Usuario | ID (prefijo) | Role | Password |
|---|---|---|---|
| `qa.aldea.a@example.com` | `ef1489ce...` | `moderator` | `Ald3aQA!2026` |
| `qa.aldea.b@example.com` | `074afbbd...` | `user` | `Ald3aQA!2026` |

## Scripts disponibles

```bash
npm run doctor:node              # Valida env y conexión Supabase
npm run supabase:doctor-db       # Valida secrets y Management API
npm run supabase:apply:policies  # Aplica supabase/policies.sql (33 policies)
npm run supabase:apply:triggers  # Aplica supabase/triggers.sql
npm run supabase:apply:seed      # Aplica supabase/seed.sql
npm run supabase:apply:all       # triggers → policies → seed
npm run qa:seed                  # Crea/verifica usuarios QA + seed
npm run qa:smoke                 # 23/23 smoke tests
npm run typecheck                # tsc --noEmit
```

## Security audit

| Check | Estado |
|---|---|
| `service_role` en app/components/services/lib | ✅ CLEAR — no encontrado |
| `EXPO_PUBLIC_SERVICE_ROLE_KEY` | ✅ CLEAR — no existe |
| `EXPO_PUBLIC_DB_PASSWORD` | ✅ CLEAR — no existe |
| `EXPO_PUBLIC_DB_URL` | ✅ CLEAR — no existe |
| `.env` con valores reales | ✅ CLEAR — solo `.env.example` vacío |
| `SUPABASE_SERVICE_ROLE_KEY` en `.replit` | ⚠️ MEDIUM — mecanismo Replit Secrets (ver ETAPA_1D) |

## Conexión DB — Workaround IPv6

La conexión TCP directa al DB (`db.{ref}.supabase.co:5432`) es IPv6-only — bloqueada por Replit.

**Solución estable**: Supabase Management API vía HTTPS:
```
https://api.supabase.com/v1/projects/apcdhwqfntujcwsbtfbu/database/query
Authorization: Bearer {SUPABASE_ACCESS_TOKEN}
```

## Release readiness

| Item | Estado |
|---|---|
| Release readiness | ✅ **GO** |
| v0.1.0 tag | ⏸ Pendiente aprobación del usuario |
| Etapa 1D completa | ✅ |

## Próximo stage

**Etapa 1E** — Crear tag `v0.1.0` y GitHub Release (requiere aprobación explícita del usuario).

**Limitaciones conocidas para Etapa 2:**
- Geofencing activo (`expo-location`, cálculo de distancia, `canPost` por proximidad)
- Mapa real de lugares cercanos
- Validación en Expo Go / dispositivo físico
- Lint y test scripts
