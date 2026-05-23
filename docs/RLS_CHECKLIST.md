# Checklist Hostil de RLS - Etapa 1A

> Intentos deliberadamente abusivos contra las políticas de `supabase/policies.sql`. Cada caso debe **fallar** con un error de RLS o devolver `0 rows`. Si alguno pasa, es un bug de seguridad bloqueante.

Requisitos: dos usuarios reales `A` y `B` autenticados (anon key + JWT). Usar el SQL Editor del dashboard logueado como cada usuario, o `supabase.from(...)` desde dos clientes con sesiones distintas.

Variables usadas abajo:

- `A_ID` = `auth.uid()` de A.
- `B_ID` = `auth.uid()` de B.
- `MSG_B` = un `place_messages.id` cuyo `user_id = B_ID`.
- `GROUP_B` = un `groups.id` cuyo `created_by = B_ID`.
- `EVENT_B` = un `events.id` cuyo `created_by = B_ID`.

## 1. Mensajes (`place_messages`)

| # | Acción como A | Esperado |
|---|---|---|
| 1.1 | `insert into place_messages (place_id, user_id, body) values ('<place>', '<B_ID>', 'spoof');` | Rechazado: `new row violates row-level security policy` (la `with check (user_id = auth.uid())` lo impide). |
| 1.2 | `update place_messages set body = 'hijack' where id = '<MSG_B>';` | 0 rows actualizadas (no hay política de update para mensajes ajenos). |
| 1.3 | `delete from place_messages where id = '<MSG_B>';` | 0 rows borradas (la política de delete exige `user_id = auth.uid()`). |
| 1.4 | A bloquea a B (`insert into blocks (blocker_id, blocked_id) values ('<A_ID>', '<B_ID>');`) y luego `select * from place_messages where user_id = '<B_ID>';` | 0 rows: la política de select filtra mensajes de usuarios bloqueados por A. |
| 1.5 | Después de 1.4, A elimina el bloqueo y vuelve a leer. | Los mensajes de B vuelven a ser visibles. |

## 2. Perfiles (`profiles`)

| # | Acción como A | Esperado |
|---|---|---|
| 2.1 | `update profiles set display_name = 'hacked' where id = '<B_ID>';` | 0 rows (la política de update requiere `id = auth.uid()`). |
| 2.2 | `insert into profiles (id, display_name) values ('<B_ID>', 'fake');` | Rechazado por la `with check (id = auth.uid())`. |
| 2.3 | `select * from profiles where id = '<B_ID>';` | Devuelve la fila (los perfiles son legibles por usuarios autenticados, por diseño). |

## 3. Grupos (`groups`) y miembros (`group_members`)

| # | Acción como A | Esperado |
|---|---|---|
| 3.1 | `insert into groups (place_id, name, created_by, visibility) values ('<place>', 'spoof', '<B_ID>', 'public');` | Rechazado por `with check (created_by = auth.uid())`. |
| 3.2 | `update groups set name = 'hijack' where id = '<GROUP_B>';` | 0 rows (solo el creador puede actualizar). |
| 3.3 | `delete from groups where id = '<GROUP_B>';` | 0 rows. |
| 3.4 | `insert into group_members (group_id, user_id) values ('<GROUP_B>', '<B_ID>');` | Rechazado por `with check (user_id = auth.uid())`. |
| 3.5 | `delete from group_members where group_id = '<GROUP_B>' and user_id = '<B_ID>';` | 0 rows (solo el propio miembro puede salir). |

## 4. Eventos (`events`) y RSVPs (`event_rsvps`)

| # | Acción como A | Esperado |
|---|---|---|
| 4.1 | `insert into events (place_id, title, starts_at, created_by) values ('<place>', 'spoof', now(), '<B_ID>');` | Rechazado. |
| 4.2 | `update events set title = 'hijack' where id = '<EVENT_B>';` | 0 rows. |
| 4.3 | `delete from events where id = '<EVENT_B>';` | 0 rows. |
| 4.4 | `insert into event_rsvps (event_id, user_id, status) values ('<EVENT_B>', '<B_ID>', 'going');` | Rechazado. |
| 4.5 | `delete from event_rsvps where event_id = '<EVENT_B>' and user_id = '<B_ID>';` | 0 rows. |

## 5. Reportes y bloqueos

| # | Acción como A | Esperado |
|---|---|---|
| 5.1 | `insert into reports (reporter_id, target_type, target_id, reason) values ('<B_ID>', 'message', '<MSG_B>', 'spoof');` | Rechazado por `with check (reporter_id = auth.uid())`. |
| 5.2 | `select * from reports where reporter_id = '<B_ID>';` | 0 rows (solo el propio reporter puede leer sus reportes). |
| 5.3 | `insert into blocks (blocker_id, blocked_id) values ('<B_ID>', '<A_ID>');` | Rechazado. |
| 5.4 | `select * from blocks where blocker_id = '<B_ID>';` | 0 rows. |

## 6. Anónimos (sin JWT)

Con cliente anon (sin sesión):

- `select` o `insert` sobre cualquier tabla con RLS debe fallar o devolver 0 rows, porque todas las políticas son `to authenticated`.

## Cómo registrar el resultado

Para cada fila, marcar `OK` si el comportamiento coincide con "Esperado", `FAIL` si no. Cualquier `FAIL` bloquea el cierre de Etapa 1A y debe abrirse como bug antes de avanzar a 1B/1C.
