# Plan de QA para tasks en progreso

Estado al 23-may-2026. Solo lista las tasks abiertas en su momento; al cierre
de cada una se mueve a `docs/ROADMAP.md` y se borra de aqui.

Reglas comunes:
- No mergear automaticamente. El usuario aprueba.
- Toda task tiene que pasar `npm run typecheck` antes de mergear.
- Cualquier RLS nuevo se documenta en `docs/RLS_CHECKLIST.md`.
- Cualquier cambio de seguridad (rate limit, moderacion) se documenta en
  `docs/SAFETY.md`.
- Si la task agrega tablas o columnas, tiene que actualizar `supabase/schema.sql`
  y, si aplica, `supabase/policies.sql`. Ambos deben seguir siendo idempotentes.

---

## Task #5 — Rate limit chat de lugar
**Estado:** MERGED (cerrado).
**Verificacion pendiente con Supabase real:** mandar 6 mensajes seguidos en un
lugar y confirmar que el 6to falla con `rate_limit_exceeded:`; mandar el mismo
texto dos veces y confirmar `duplicate_message:`.

## Task #6 — Notificar a moderacion cuando llegan reportes nuevos
**Estado:** IMPLEMENTED (pendiente revision/merge).
**Objetivo:** que un reporte nuevo (`public.reports`) dispare aviso a un canal
de moderacion. Sin backend de mail/push: probablemente un toggle interno o
tabla `report_notifications`.

**Archivos esperados:**
- `supabase/schema.sql` (tabla `report_notifications` o columna `notified_at`)
- `supabase/policies.sql` (lectura solo para rol moderador)
- `services/moderation.ts` (helper `listPendingReportNotifications`)
- pantalla nueva o ampliacion de `app/(app)/moderation/*` si existe

**Riesgo:**
- Filtrar reportes a usuarios no moderadores -> revisar policy.
- Doble notificacion -> indice unico por (`report_id`, `channel`).

**Como probar:**
1. Aplicar SQL nuevo.
2. Crear reporte como usuario A.
3. Confirmar fila en la tabla de notificaciones.
4. Como usuario no-moderador, verificar que NO ve la tabla.

**Criterio de merge:**
- Typecheck OK.
- Policy de lectura solo para moderadores.
- Documentado en `docs/SAFETY.md` seccion "Cola de moderacion".

**Dependencia con Supabase real:** alta (necesita ver inserts y RLS).
**RLS adicional:** si.

## Task #7 — RSVP "tal vez" / "no asisto"
**Estado:** MERGING.
**Objetivo:** extender `event_rsvps.status` a {`going`, `maybe`, `declined`}.

**Archivos esperados:**
- `supabase/schema.sql` (check constraint nuevo o eliminado el viejo)
- `services/events.ts` (`setRsvp` acepta los tres estados)
- `components/EventRsvpControl.tsx` o equivalente
- `app/event/[id]/index.tsx`

**Riesgo:**
- Filas viejas con `status = 'going'` deben seguir valiendo.
- El check constraint debe permitir los tres valores.

**Como probar:**
1. Aplicar schema.
2. Como user A, RSVP -> maybe -> declined -> going. Confirmar persistencia.
3. Como user B en el mismo evento, RSVP independiente.

**Criterio de merge:** typecheck OK; UI muestra estado actual; el upsert no
duplica filas.

**Dependencia con Supabase real:** media.
**RLS adicional:** no (la policy de `event_rsvps` ya filtra por `user_id`).

## Task #8 — Aprobar miembros pendientes en grupos por aprobacion
**Estado:** IN_PROGRESS.
**Objetivo:** flujo de unirse a grupo `private` o `request` queda pendiente y
el owner aprueba.

**Archivos esperados:**
- `supabase/schema.sql` (`group_members.status` o nueva tabla `group_join_requests`)
- `supabase/policies.sql` (owner puede leer pendientes; solicitante puede leer su propia solicitud)
- `services/groups.ts` (`requestJoinGroup`, `approveJoinRequest`, `rejectJoinRequest`)
- `app/group/[id]/requests.tsx` (pantalla nueva visible solo a owner)
- `app/group/[id]/index.tsx` (CTA "Solicitar union" en lugar de "Unirme" cuando visibility = approval)

**Riesgo:**
- Que un no-owner pueda aprobar -> bloquear por policy.
- Que el solicitante vea solicitudes de otros -> filtrar por `user_id`.
- Conteo de miembros se actualiza solo al aprobar.

**Como probar:**
1. User A crea grupo `approval`.
2. User B solicita union (NO debe quedar como member).
3. User C (otro) no ve la solicitud.
4. User A aprueba -> User B ve grupo en "Mis grupos".
5. User A rechaza una segunda solicitud -> User B la ve como `rejected`.

**Criterio de merge:** typecheck OK; RLS validada con dos usuarios; UI no
ofrece "aprobar" a no-owners.

**Dependencia con Supabase real:** alta.
**RLS adicional:** si (split lectura por rol).

## Task #9 — Selector de fecha/hora amigable
**Estado:** MERGED (cerrado).
**Verificacion:** abrir `/place/<id>/new-event` y `/event/<id>/edit`, confirmar
picker nativo en iOS/Android y `<input type="datetime-local">` en web.

---

## Tasks propuestas (no priorizar todavia)

- #14, #15, #16, #17, #18, #19, #20: features de evento, moderacion y grupos.
  Quedan en backlog. Revisar al cerrar el bloque actual.

---

## Plan de merge sugerido

1. Cerrar Etapa 1A-QA contra Supabase real (este documento es parte de eso).
2. Mergear tasks ya implementadas que no tocan SQL: #9 (hecho), #5 (hecho).
3. Mergear tasks que tocan SQL solo despues de re-aplicar `schema.sql` y
   `policies.sql` en el proyecto y confirmar que no rompen el smoke test:
   #7, #8, #6.
4. Despues del bloque, recien evaluar tag `v0.1.0`.
