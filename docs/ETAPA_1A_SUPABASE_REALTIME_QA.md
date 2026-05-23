# Etapa 1A-QA Real — Supabase Realtime Validation

Reporte actualizado: 23-may-2026

---

## 1. Estado final

| Item | Estado |
|---|---|
| Supabase real | ✅ Conectado (no mocks) |
| Mocks activos | ✅ Desactivados — URL válida |
| Auth / registro | ⏸ BLOQUEADO — SQL sin aplicar |
| Profile | ⏸ BLOQUEADO — SQL sin aplicar |
| Places reales | ⏸ BLOQUEADO — SQL sin aplicar |
| Chat realtime | ⏸ BLOQUEADO — SQL sin aplicar |
| RLS | ⏸ BLOQUEADO — SQL sin aplicar |
| Grupos | ⏸ BLOQUEADO — SQL sin aplicar |
| Eventos | ⏸ BLOQUEADO — SQL sin aplicar |
| Reportes/bloqueos | ⏸ BLOQUEADO — SQL sin aplicar |
| Release readiness | ❌ No — SQL requerido primero |

---

## 2. Credenciales

| Variable | Estado |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Válida — `apcdhwqfntujcwsbtfbu.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ JWT presente (len=208) |
| Valores idénticos | ✅ No — son distintos |
| App usa backend real | ✅ Confirmado |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Ausente — correcto |

**Verificado con:** `npm run doctor:node` → `[OK] Supabase ready (effective): app will connect to real Supabase`

---

## 3. SQL aplicado en Supabase

Verificación vía Supabase REST API con el anon key:

| Tabla | Estado |
|---|---|
| `profiles` | ❌ HTTP 404 — tabla no existe |
| `places` | ❌ HTTP 404 — tabla no existe |
| `place_messages` | ❌ HTTP 404 — tabla no existe |
| `groups` | ❌ HTTP 404 — tabla no existe |
| `group_members` | ❌ HTTP 404 — tabla no existe |
| `events` | ❌ HTTP 404 — tabla no existe |
| `event_rsvps` | ❌ HTTP 404 — tabla no existe |
| `reports` | ❌ HTTP 404 — tabla no existe |
| `blocks` | ❌ HTTP 404 — tabla no existe |

**Conclusión: ningún archivo SQL fue aplicado todavía en el proyecto Supabase.**

### Archivos SQL disponibles en el repo

| Archivo | Líneas | Contenido |
|---|---|---|
| `supabase/schema.sql` | 198 | Tablas, triggers, índices, realtime publication |
| `supabase/profiles-trigger.sql` | 37 | Trigger auto-create profile al signup |
| `supabase/triggers.sql` | 52 | Rate limit de mensajes |
| `supabase/policies.sql` | 306 | RLS policies por tabla |
| `supabase/seed.sql` | 187 | Places iniciales (Parque Kennedy, Barranco Plaza, etc.) |

### Nombres de tabla — sin mismatch

Schema y código usan exactamente los mismos nombres:
`profiles`, `places`, `place_messages`, `groups`, `group_members`,
`events`, `event_rsvps`, `reports`, `blocks`

---

## 4. Auth / Profile

⏸ No ejecutado — requiere que las tablas existan primero.

Lógica confirmada en código:
- `supabase/schema.sql` incluye trigger `on_auth_user_created` que crea
  automáticamente un row en `public.profiles` al registrar usuario nuevo.
- `services/auth.ts` usa `supabase.auth.signUp()` y `supabase.auth.signInWithPassword()`.

---

## 5. Places reales

⏸ No ejecutado — requiere `places` table + seed data.

`supabase/seed.sql` define: Parque Kennedy, Barranco Plaza, Cafe Cultural
Miraflores, Coworking Creativo — con IDs fijos y coordenadas.

---

## 6. Chat realtime

⏸ No ejecutado.

Implementación confirmada en `services/messages.ts`:
- Usa `supabase.channel()` con filter por `place_id`.
- `schema.sql` incluye `alter publication supabase_realtime add table public.place_messages` (idempotente).

---

## 7. RLS

⏸ No ejecutado.

`supabase/policies.sql` define RLS para todas las tablas. Policies clave:
- `profiles`: readable by authenticated, update solo el propio.
- `places`: readable si `visibility = 'public'`.
- `place_messages`: select/insert by authenticated, insert solo con propio `user_id`.
- `groups`, `events`, `reports`, `blocks`: por `auth.uid()`.

---

## 8. QA Grupos / Eventos / Reportes / Bloqueos

⏸ No ejecutado — requiere schema.

---

## 9. QA Moderation Inbox

⏸ No ejecutado.

Requiere schema + `profiles.is_moderator = true` en al menos un usuario.
SQL para asignar moderador (ejecutar en SQL Editor de Supabase):
```sql
update public.profiles set is_moderator = true where id = '<user-uuid>';
```

---

## 10. Bugs encontrados

| Bug | Impacto | Estado |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` tenía JWT pegado (mismo valor que anon key) | App usaba mocks | ✅ Corregido — URL válida en Secrets |
| Puerto 5000 no mapeado a proxy público de Replit | Canvas iframe en blanco | ✅ Corregido — proxy en 8081 via `scripts/start-web.sh` |
| Metro bundler cacheaba bundle con credenciales viejas | App seguía en mocks tras corregir URL | ✅ Corregido — reinicio limpio |
| SQL nunca aplicado en Supabase | Todas las tablas inexistentes (HTTP 404) | ⏸ Pendiente — acción del usuario |

---

## 11. Fixes aplicados

| Archivo | Fix |
|---|---|
| `lib/supabase.ts` | Fallback a `EXPO_PUBLIC_SUPABASE_PROJECT_URL` si URL principal parece JWT |
| `scripts/doctor-node.mjs` | Detección de valores idénticos URL/anon key, sugerencia de fallback |
| `scripts/doctor-env.mjs` | Nuevo — diagnóstico seguro de las 3 variables env |
| `scripts/start-web.sh` | Proxy 8081→5000 para acceso público |
| `app/_layout.tsx` | Phone frame web (max-width 430px) |
| `supabase/profiles-trigger.sql` | Standalone trigger creado en esta sesión |
| `docs/SUPABASE_APPLY_SQL.md` | Guía de aplicación de SQL |

---

## 12. Validaciones de entorno

| Check | Resultado |
|---|---|
| `doctor:node` | ✅ `[OK] Supabase ready (effective)` |
| `typecheck` | ✅ 0 errores |
| Preview web | ✅ Running en puertos 5000/8081 |
| App usa mocks | ✅ No — URL válida activa backend real |
| Secrets impresos | ✅ No |
| `service_role` usado | ✅ No |

---

## 13. Bloqueador activo

**SQL sin aplicar en Supabase.**

El usuario debe ejecutar en el **SQL Editor** del dashboard de Supabase
(`https://supabase.com/dashboard/project/apcdhwqfntujcwsbtfbu/sql`),
en este orden:

1. `supabase/schema.sql`
2. `supabase/triggers.sql`
3. `supabase/policies.sql`
4. `supabase/seed.sql` (opcional pero recomendado)

Ver instrucciones completas en `docs/SUPABASE_APPLY_SQL.md`.

---

## 14. Próximo stage

**Si el usuario aplica el SQL →** continuar Etapa 1A-QA-Smoke: sign-up,
profile, places, chat realtime, RLS, grupos, eventos, reportes.

**Si el SQL falla →** Etapa 1A-SQL-Fix: revisar errores exactos del SQL
Editor y corregir schema.

**No crear tag `v0.1.0` hasta cerrar smoke test y RLS checklist.**
