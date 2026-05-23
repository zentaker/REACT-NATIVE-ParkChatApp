# Checklist RLS — Aldea / ParkChat

Actualizado: 23-may-2026 (Etapa 1D)

> Validación de Row Level Security en las 9 tablas. Todos los intentos hostiles deben fallar con error `42501` o devolver `0 rows`.

---

## Resultado automatizado (qa:smoke)

Todos los checks de RLS pasan: **7/7 escenarios hostiles bloqueados**.

---

## Estado por tabla

| Tabla | RLS habilitado | Policies | Estado |
|---|---|---|---|
| `profiles` | ✅ | read (anon/auth), update (own) | PASS |
| `places` | ✅ | read (anon/auth) | PASS |
| `place_messages` | ✅ | read (auth, filtered by blocks), insert (own), update (own), delete (own) | PASS |
| `groups` | ✅ | read (access_level), insert (auth, own created_by), update (owner) | PASS |
| `group_members` | ✅ | read (member/owner), insert (own), update (owner) | PASS |
| `events` | ✅ | read (auth), insert (own), update (own), delete (own) | PASS |
| `event_rsvps` | ✅ | read (auth), insert (own), update (own) | PASS |
| `reports` | ✅ | insert (own reporter_id), read (own/moderator) | PASS |
| `blocks` | ✅ | insert (own blocker_id), read (own), delete (own) | PASS |

---

## Escenarios hostiles — resultados de qa:smoke

### 1. place_messages — spoof user_id

| # | Intento | Esperado | Resultado |
|---|---|---|---|
| 1.1 | A inserta con `user_id = B_ID` | Error 42501 | ✅ PASS |
| 1.2 | A edita mensaje de B (`update`) | 0 rows | ✅ PASS |
| 1.3 | A bloquea B → lee mensajes de B | 0 rows | ✅ PASS |

### 2. profiles — edición ajena

| # | Intento | Esperado | Resultado |
|---|---|---|---|
| 2.1 | A actualiza `display_name` de B | 0 rows | ✅ PASS |

### 3. reports — spoof reporter_id

| # | Intento | Esperado | Resultado |
|---|---|---|---|
| 3.1 | A inserta con `reporter_id = B_ID` | Error 42501 | ✅ PASS |

### 4. blocks — spoof blocker_id

| # | Intento | Esperado | Resultado |
|---|---|---|---|
| 4.1 | A inserta con `blocker_id = B_ID` | Error 42501 | ✅ PASS |

### 5. groups — spoof created_by

| # | Intento | Esperado | Resultado |
|---|---|---|---|
| 5.1 | A inserta con `created_by = B_ID` | Error 42501 | ✅ PASS |

### 6. event_rsvps — spoof user_id

| # | Intento | Esperado | Resultado |
|---|---|---|---|
| 6.1 | B inserta con `user_id = A_ID` | Error 42501 | ✅ PASS |

---

## Verificación de infraestructura

```bash
# Confirmar RLS habilitado en todas las tablas
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

Resultado confirmado (23-may-2026):

```json
[
  {"tablename":"blocks","rowsecurity":true},
  {"tablename":"event_rsvps","rowsecurity":true},
  {"tablename":"events","rowsecurity":true},
  {"tablename":"group_members","rowsecurity":true},
  {"tablename":"groups","rowsecurity":true},
  {"tablename":"place_messages","rowsecurity":true},
  {"tablename":"places","rowsecurity":true},
  {"tablename":"profiles","rowsecurity":true},
  {"tablename":"reports","rowsecurity":true}
]
```

Todas las 9 tablas: `rowsecurity = true` ✅

---

## Notas

- **42501**: código PostgreSQL para `row-level security policy violation`.
- Las policies usan `auth.uid()` vía Supabase JWT — el token es verificado por PostgREST antes de ejecutar cualquier query.
- El filtrado de mensajes de usuarios bloqueados es via política de SELECT en `place_messages`, no solo client-side.
- Para ejecutar los escenarios manualmente: ver `docs/SMOKE_TEST.md` o `scripts/qa-smoke.mjs`.
