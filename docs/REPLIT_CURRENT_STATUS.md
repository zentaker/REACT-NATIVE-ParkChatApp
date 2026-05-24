# Estado actual en Replit

Snapshot del workspace al 24-may-2026. **Etapa 1E — Release v0.1.0 en proceso (push pendiente).**

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

## Etapa 1E — Release v0.1.0 (24-may-2026)

| Item | Estado | Detalle |
|---|---|---|
| Release readiness | ✅ **GO** | Verificado §15 de `RELEASE_V0_1_0_CHECKLIST.md` |
| `doctor:node` | ✅ PASS | Node v20.20.0, URL válida, anon key presente |
| `supabase:doctor-db` | ✅ PASS | 10/10 OK |
| `typecheck` | ✅ PASS | 0 errores |
| `qa:smoke` | ✅ **23/23 PASS** | Todas las validaciones OK |
| `.github/workflows/release.yml` | ✅ Existe | Trigger `v*`, `permissions: write`, bundle correcto |
| commit base | ✅ `5d28541` | HEAD de main |
| tag `v0.1.0` | ⚠️ PENDIENTE MANUAL | git tag bloqueado en sandbox Replit |
| push `origin main` | ⚠️ PENDIENTE MANUAL | Timeout de red desde Replit → acción manual |
| push `origin v0.1.0` | ⚠️ PENDIENTE MANUAL | Requiere push después del tag |
| GitHub Actions | ⏳ Pendiente push tag | Se activa al recibir tag en GitHub |
| GitHub Release | ⏳ Pendiente | Se genera via `release.yml` |
| `docs/RELEASE_V0_1_0_REPORT.md` | ✅ Creado | Reporte completo de Etapa 1E |

### Acción manual requerida del usuario

```bash
# Desde terminal local o GitHub Desktop:
git tag v0.1.0
git push origin main
git push origin v0.1.0
```

Luego verificar en: `github.com/zentaker/REACT-NATIVE-ParkChatApp` → Actions → Releases

## Próximo stage

**Etapa 2A** — Graph-ready product layer: topics, relationships and lightweight social graph UI.  
*(Solo iniciar después de confirmar GitHub Release v0.1.0 creado.)*

**Limitaciones conocidas para Etapa 2:**
- Geofencing activo (`expo-location`, cálculo de distancia, `canPost` por proximidad)
- Mapa real de lugares cercanos
- Validación en Expo Go / dispositivo físico
- Lint y test scripts
