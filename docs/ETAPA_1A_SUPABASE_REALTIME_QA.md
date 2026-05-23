# Etapa 1A-QA Real — Supabase Smoke Test

Reporte actualizado: 23-may-2026

---

## 1. Estado general

| Item | Estado |
|---|---|
| Supabase real | ✅ Conectado (no mocks) |
| Mocks activos | ✅ Desactivados — URL válida |
| Tablas (9/9) | ✅ Existen |
| Seed (places) | ❌ Vacío — seed.sql no fue aplicado |
| Auth / registro | ⏸ BLOQUEADO — email confirmation requerida + rate limit |
| Profile auto-create | ⏸ No validado — depende de auth |
| Places en app | ⏸ No validado — seed vacío |
| Chat realtime | ⏸ No validado — depende de auth + seed |
| RLS (anon) | ✅ Verificado — bloqueo correcto |
| RLS (auth user vs user) | ⏸ No validado — depende de auth |
| Grupos | ⏸ No validado — depende de auth + seed |
| Eventos | ⏸ No validado — depende de auth + seed |
| Reportes/bloqueos | ⏸ No validado — depende de auth |
| Moderation inbox | ⏸ No validado |
| Release readiness | ❌ No — 2 acciones de usuario pendientes |

---

## 2. Credenciales

| Variable | Estado |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Válida — `apcdhwqfntujcwsbtfbu.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ JWT presente (len=208) |
| App usa backend real | ✅ Confirmado — sin mocks |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Ausente — correcto |

`npm run doctor:node` → `[OK] Supabase ready (effective): app will connect to real Supabase`

---

## 3. Tablas Supabase — verificadas vía REST API

| Tabla | Existe | Rows |
|---|---|---|
| `profiles` | ✅ HTTP 200 | 0 |
| `places` | ✅ HTTP 200 | 0 |
| `place_messages` | ✅ HTTP 200 | 0 |
| `groups` | ✅ HTTP 200 | 0 |
| `group_members` | ✅ HTTP 200 | 0 |
| `events` | ✅ HTTP 200 | 0 |
| `event_rsvps` | ✅ HTTP 200 | 0 |
| `reports` | ✅ HTTP 200 | 0 |
| `blocks` | ✅ HTTP 200 | 0 |

Todas las tablas existen. Cero rows es correcto para tablas sin seed ni usuarios todavía.

---

## 4. Seed — `supabase/seed.sql`

**Estado: NO aplicado.** La tabla `places` tiene 0 rows.

El `seed.sql` define:
- Parque Kennedy (Miraflores)
- Barranco Plaza (Barranco)
- Cafe Cultural Miraflores (Miraflores)
- Coworking Creativo (Miraflores)

...y grupos + eventos que dependen de un `profile` existente (el `DO $$` del seed los omite si no hay profiles todavía).

**Acción requerida:** Aplicar `supabase/seed.sql` en el SQL Editor de Supabase.

---

## 5. RLS — verificado con anon key (sin JWT de usuario)

| Test | Resultado | Esperado |
|---|---|---|
| GET `places` (anon) | ✅ HTTP 200, rows=0 | ✅ RLS filtra — sin rows visibles |
| GET `profiles` (anon) | ✅ HTTP 200, rows=0 | ✅ RLS filtra — sin rows visibles |
| INSERT `place_messages` (anon) | ✅ HTTP 401 `42501` RLS violation | ✅ Bloqueado correctamente |
| INSERT `places` (anon) | ✅ HTTP 400 no grant anon | ✅ Bloqueado correctamente |

RLS funciona para usuarios no autenticados. Verificación inter-usuario (A vs B) pendiente hasta tener auth funcional.

### Policies revisadas — sin issues en código

- `profiles`: readable by authenticated, update/insert solo propio `auth.uid()`
- `places`: select by authenticated si `visibility='public'`, insert by authenticated
- `place_messages`: select by authenticated (filtra bloqueados), insert con `user_id=auth.uid()`, delete solo propio
- `groups`: select público, insert/update/delete con `created_by=auth.uid()`
- `group_members`: insert/delete con `user_id=auth.uid()`
- `events`: select all authenticated, insert/update/delete con `created_by=auth.uid()`
- `event_rsvps`: select all, insert/update/delete con `user_id=auth.uid()`
- `reports`: insert con `reporter_id=auth.uid()`, select solo propios o moderadores
- `blocks`: select/insert/delete con `blocker_id=auth.uid()`

---

## 6. Auth / Profile

**Estado: BLOQUEADO.**

Razones:
1. `mailer_autoconfirm: false` — email confirmation requerida en Supabase
2. Rate limit: HTTP 429 al intentar signup programático
3. `anonymous_users_enabled: false`

No se puede crear usuarios de prueba vía API. Se requiere intervención del usuario.

**Acción requerida (elegir una):**

**Opción A (recomendada para QA):** Deshabilitar confirmación de email temporalmente:
- Supabase Dashboard → Authentication → Settings → Email Auth
- Desactivar "Enable email confirmations"
- Después de QA, volver a activar

**Opción B:** Crear usuario manualmente en Supabase:
- Supabase Dashboard → Authentication → Users → Invite user
- Crear un usuario de prueba con email real
- Luego aplicar seed.sql (usa el primer profile que exista)

**Opción C:** Registrarse manualmente en la app del preview y confirmar el email recibido.

---

## 7. Smoke test Auth / Profile

⏸ Pendiente — requiere resolución del bloqueo de auth.

Plan una vez desbloqueado:
1. Registrar usuario A con display_name
2. Confirmar signup exitoso
3. Verificar row en `profiles` con `id = auth.user.id` y `display_name` correcto
4. Logout + re-login
5. Confirmar sesión activa

---

## 8. Smoke test Places

⏸ Pendiente — requiere seed + auth.

---

## 9. Smoke test Chat Realtime

⏸ Pendiente — requiere seed + auth.

Plan:
- Dos sesiones/ventanas con usuarios A y B en mismo `place_id`
- A envía → B recibe sin refresh
- Verificar realtime en `supabase_realtime` publication para `place_messages`

---

## 10. QA Grupos / Eventos / Reportes / Bloqueos

⏸ Pendiente — requiere auth.

---

## 11. Moderation Inbox

⏸ Pendiente.

Para asignar rol moderador (ejecutar en SQL Editor tras tener al menos un user registrado):
```sql
update public.profiles set is_moderator = true where id = '<user-uuid>';
```

---

## 12. Bugs encontrados

| Bug | Impacto | Estado |
|---|---|---|
| Texto "Sin credenciales de Supabase, Aldea usa datos mock" hardcoded en sign-in | Visible siempre aunque credenciales sí estén configuradas | ✅ Corregido — ahora condicional |
| Seed.sql no aplicado | Places vacíos, grupos/eventos sin datos iniciales | ⏸ Acción de usuario |
| Email rate limit Supabase (free tier) | No se puede registrar usuario de prueba vía API | ⏸ Acción de usuario |
| Email confirmation requerida | Bloquea smoke test de auth programático | ⏸ Acción de usuario |

---

## 13. Fixes aplicados en esta sesión

| Archivo | Fix |
|---|---|
| `app/(auth)/sign-in.tsx` | Texto helper ahora condicional: se muestra solo si `!isSupabaseConfigured` |
| `docs/ETAPA_1A_SUPABASE_REALTIME_QA.md` | Reporte actualizado con resultados reales de API |
| `docs/REPLIT_CURRENT_STATUS.md` | Estado actualizado (tablas existen, seed pendiente) |

---

## 14. Validaciones de entorno

| Check | Resultado |
|---|---|
| `doctor:node` | ✅ `[OK] Supabase ready (effective)` |
| `typecheck` | ✅ 0 errores |
| Preview web | ✅ Running — login screen real |
| App usa mocks | ✅ No |
| Secrets impresos | ✅ No |
| `service_role` usado | ✅ No |
| Tablas API (9/9) | ✅ Existen |
| RLS anon | ✅ Bloqueado correctamente |

---

## 15. Bloqueadores activos

| Bloqueador | Causa | Acción |
|---|---|---|
| Seed vacío | `seed.sql` no fue aplicado | Aplicar en SQL Editor |
| Auth no testeable | Email confirmation ON + rate limit | Desactivar confirmación en Auth Settings (**Opción A**) o registrar manualmente |

---

## 16. Release readiness

❌ No ready.

Criterios pendientes:
- [ ] seed.sql aplicado → places con datos reales
- [ ] Auth: desactivar email confirmation para QA (o usuario manual)
- [ ] Registro/login funciona en app
- [ ] Profile se crea automáticamente
- [ ] Places seed visibles post-login
- [ ] Chat place_messages funciona
- [ ] Realtime dos clientes verificado
- [ ] RLS inter-usuario validado
- [ ] Grupos/eventos funcionales
- [ ] Reportes/bloqueos funcionales

---

## 17. Próximo stage

**Con las dos acciones del usuario resueltas** (seed + auth):
→ Continuar Etapa 1A-QA-Smoke: auth, profile, places, chat, RLS inter-user, grupos, eventos, reportes.

**Si auth sigue bloqueado:**
→ Etapa 1A-Auth-Fix: investigar config de Supabase Auth.

**No crear tag `v0.1.0` hasta cerrar smoke test completo.**
