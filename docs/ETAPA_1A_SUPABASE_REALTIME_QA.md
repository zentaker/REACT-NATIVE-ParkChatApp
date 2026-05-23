# Etapa 1A-QA Real — Supabase Smoke Test

Reporte actualizado: 23-may-2026

---

## 1. Estado general

| Item | Estado |
|---|---|
| Supabase real | ✅ Conectado (no mocks) |
| Mocks activos | ✅ Desactivados — URL válida |
| Tablas (9/9) | ✅ Existen |
| RLS policies (33) | ✅ Aplicadas via Management API |
| Triggers | ✅ Aplicados (`handle_new_user`, `set_updated_at`) |
| Seed (places/groups/events) | ✅ Aplicado (4 places, 5 groups, 4 events) |
| QA users creados | ✅ qa.aldea.a + qa.aldea.b (email confirmed) |
| Auth / login | ✅ Funciona con anon key + password |
| Profile auto-create | ✅ Trigger activo |
| Places en app | ✅ 4 places visibles para usuario autenticado |
| Chat (place_messages) | ✅ Insert + select funcionan |
| Reports | ✅ Insert funciona (schema real: message_id, reported_user_id) |
| Blocks | ✅ Insert + filtrado post-block funciona |
| Groups | ✅ Create + read funcionan (access_level real) |
| Events + RSVP | ✅ Create + RSVP funcionan |
| RLS malicioso | ✅ Bloqueado en 7/7 escenarios |
| Chat realtime | ⏸ Requiere validación manual en browser (WebSocket persistente) |

---

## 2. Resultado smoke test — 23/23 PASS

```
PASS: 23
FAIL: 0
```

### Detalle de checks

| # | Check | Resultado |
|---|---|---|
| 1 | Login User A | PASS |
| 2 | Login User B | PASS |
| 3 | User A reads places (4 rows) | PASS |
| 4 | User A reads own profile | PASS |
| 5 | User A inserts place_message | PASS |
| 6 | User B sees message from A | PASS |
| 7 | User B inserts reply | PASS |
| 8 | User A sees reply from B | PASS |
| 9 | RLS: A spoofing B user_id en place_messages | PASS (42501) |
| 10 | RLS: A edita mensaje de B (0 rows afectadas) | PASS |
| 11 | RLS: A edita profile de B (0 rows afectadas) | PASS |
| 12 | A lee profile de B (permitido) | PASS |
| 13 | A crea report con message_id real | PASS |
| 14 | RLS: A spoofing B reporter_id | PASS (42501) |
| 15 | A bloquea a B | PASS |
| 16 | RLS post-block: mensajes de B filtrados para A | PASS (0 visible) |
| 17 | RLS: A spoofing B blocker_id | PASS (42501) |
| 18 | A crea grupo (access_level=public) | PASS |
| 19 | B lee grupos públicos (5 visibles) | PASS |
| 20 | RLS: A spoofing B created_by en groups | PASS (42501) |
| 21 | A crea evento | PASS |
| 22 | B hace RSVP a evento de A | PASS |
| 23 | RLS: B spoofing A user_id en event_rsvps | PASS (42501) |

---

## 3. Usuarios QA

| Usuario | ID | Estado |
|---|---|---|
| qa.aldea.a@example.com | ef1489ce-... | ✅ Creado, email confirmado, profile OK |
| qa.aldea.b@example.com | 074afbbd-... | ✅ Creado, email confirmado, profile OK |

Password (QA-only, no producción): `Ald3aQA!2026`

---

## 4. Correcciones críticas aplicadas

### Schema drift corregido

El DB real de Supabase tenía un schema distinto al `schema.sql` original. Se corrigieron:

- `services/moderation.ts`: Reports usa `message_id/reported_user_id` (no `target_type/target_id`). `isCurrentUserModerator` usa `role = 'moderator'` (no `is_moderator`).
- `services/groups.ts`: Create/update usa `access_level` (no `visibility`).
- `supabase/seed.sql`: Reescrito con columnas reales (`type`, `country`, `radius_meters`, `access_level`).
- `supabase/policies.sql`: Bugs corregidos (`groups.visibility → access_level`, `is_moderator → role`).

### Bug crítico en QA client

`createUserClient()` en `scripts/lib/supabase-admin.mjs` usaba `setSession()` asíncrono de forma síncrona, causando que el JWT nunca se enviara en los headers. Corregido usando `global.headers.Authorization` en el constructor del cliente.

---

## 5. Automatización DB

Ver `docs/SUPABASE_DB_AUTOMATION.md` para detalles completos.

Scripts usados:
```bash
npm run supabase:doctor-db        # 10/10 OK
npm run supabase:apply:policies   # 33 políticas aplicadas
npm run supabase:apply:triggers   # OK
npm run supabase:apply:seed       # OK
npm run qa:seed                   # users + seed OK
npm run qa:smoke                  # 23/23 PASS
```

---

## 6. Validación de Realtime (manual)

Realtime requiere WebSocket persistente — no automatizable desde Node.js script.

**Pasos manuales:**
1. Abrir la app en dos pestañas del browser.
2. Login con QA_UserA en la primera pestaña.
3. Login con QA_UserB en la segunda pestaña.
4. Ambos navegan al mismo parque (Parque Kennedy).
5. QA_UserA envía un mensaje → debe aparecer en la pestaña de QA_UserB en < 1 segundo.
6. QA_UserB responde → debe aparecer en la pestaña de QA_UserA.

`place_messages` está publicada en `supabase_realtime` (triggers.sql).

---

## 7. Próximo stage

**Etapa 1D — Release QA y preparación v0.1.0**

Pendiente:
- Validación de Realtime en browser (manual)
- Test de geofencing (location permission + radius check)
- Validación de moderación end-to-end (reportar → revisar como moderador)
- Preparación de release notes y tag `v0.1.0`
