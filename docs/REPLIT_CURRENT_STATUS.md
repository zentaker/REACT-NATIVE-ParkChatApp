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
| Preview web | ✅ Login screen real de Supabase |
| App usa mocks | ✅ No — Supabase real conectado |

## Backend Supabase
- **URL:** `apcdhwqfntujcwsbtfbu.supabase.co` ✅
- **Anon key:** válida ✅
- **Supabase real:** conectado ✅
- **Mocks:** desactivados ✅
- **Tablas (9/9):** existen ✅
- **Seed:** ❌ NO aplicado — places vacíos
- **service_role:** ausente ✅

## Etapas
| Etapa | Estado código | QA real |
|---|---|---|
| Etapa 0 — base UI + nav | ✅ Hecho | N/A |
| Etapa 1A — auth + places + chat realtime | ✅ Hecho | ⏸ Parcial — tablas OK, seed pendiente |
| Etapa 1B — grupos y eventos | ✅ Hecho | ⏸ Pendiente — depende de auth + seed |
| Etapa 1C — reportes + bloqueos + rate limit | ✅ Hecho | ⏸ Pendiente — depende de auth |
| Etapa 2 / 3 / Post-MVP | No iniciado | — |

## Bloqueadores activos
1. **Seed vacío:** `supabase/seed.sql` no fue aplicado → tabla `places` tiene 0 rows.
   - Acción: SQL Editor → pegar y ejecutar `supabase/seed.sql`

2. **Auth no testeable:** Supabase tiene email confirmation requerida (`mailer_autoconfirm: false`) y el proyecto alcanzó el rate limit de emails.
   - Acción A (recomendada para QA): Auth Settings → desactivar "Enable email confirmations"
   - Acción B: Crear usuario manualmente vía Supabase Dashboard → Authentication → Users → Invite user

## Fixes aplicados en esta sesión
- `app/(auth)/sign-in.tsx` — texto helper ahora condicional (solo si no hay credenciales)
- `docs/ETAPA_1A_SUPABASE_REALTIME_QA.md` — reporte con resultados reales de API

## Próximo stage
Etapa 1A-QA-Smoke continua cuando el usuario:
1. Aplica `seed.sql` en SQL Editor
2. Desactiva email confirmation en Auth Settings (o crea usuario manual)

No crear tag `v0.1.0` todavía.
