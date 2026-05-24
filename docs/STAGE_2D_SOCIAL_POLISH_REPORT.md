# Stage 2D — Social Polish: Reporte Final

## Estado

| Item | Resultado |
|---|---|
| Stage 1 baseline (qa:smoke) | PASS 23/23 |
| Stage 2A (check:graph) | PASS 33/33 |
| Stage 2A (qa:graph) | PASS 23/23 |
| Stage 2B (qa:geo) | PASS 12/12 |
| Stage 2C (qa:geofence) | PASS 15/15 |
| check:notifications | PASS 12/12 |
| qa:notifications | PASS 12/12 |
| qa:doctor | OK |
| typecheck | 0 errores |

---

## Schema: in_app_notifications

Tabla nueva `in_app_notifications` creada en Supabase.

### Columns
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid FK → profiles | Destinatario de la notificación |
| actor_id | uuid FK → profiles | Quién generó la notificación |
| place_id | uuid FK → places | Lugar relacionado (opcional) |
| group_id | uuid FK → groups | Grupo relacionado (opcional) |
| event_id | uuid FK → events | Evento relacionado (opcional) |
| report_id | uuid FK → reports | Reporte relacionado (opcional) |
| type | text | Tipo de notificación |
| title | text | Título visible |
| body | text | Cuerpo descriptivo (opcional) |
| read_at | timestamptz | Null = no leída |
| created_at | timestamptz | default now() |

### Tipos de notificación
- `group_join_request` — usuario solicita ingreso a grupo con aprobación
- `group_member_approved` — solicitud aprobada por owner
- `group_member_rejected` — solicitud rechazada por owner
- `event_rsvp_changed` — usuario cambia RSVP en evento
- `report_created` — nuevo reporte creado
- `report_status_changed` — estado de reporte actualizado
- `geofence_blocked_post` — (reservado)
- `topic_trending` — (reservado)

### RLS Policies
| Policy | Operación | Regla |
|---|---|---|
| notifications_select_own | SELECT | user_id = auth.uid() |
| notifications_update_own | UPDATE | user_id = auth.uid() |
| notifications_insert_actor | INSERT | actor_id = auth.uid() |
| notifications_delete_own | DELETE | user_id = auth.uid() |

### Índices
- `(user_id, created_at desc)` — listado principal
- `(user_id, read_at)` — conteo de no leídas
- `(type)` — filtrado por tipo
- `(group_id)`, `(event_id)`, `(place_id)` — navegación relacionada

---

## Servicio: services/notifications.ts

```ts
getMyNotifications(limit?)         // lista de notificaciones del usuario
getUnreadNotificationCount()        // conteo de no leídas
markNotificationRead(id)            // marcar una como leída
markAllNotificationsRead()          // marcar todas como leídas
createNotification(input)           // crear notificación genérica
createGroupJoinRequestNotification  // hook: joinGroup → owner
createGroupApprovalNotification     // hook: approve/reject → solicitante
createEventRsvpNotification         // hook: setRsvpStatus → event creator
createReportNotification            // para uso de moderación
```

---

## Hooks integrados en flujos existentes

### joinGroup (services/groups.ts)
- Si `status === "pending"` (grupo con `approval_required` o `invite_only`)
- → Crea `group_join_request` notification para el owner del grupo
- Fire-and-forget con `.catch(() => {})` — no bloquea el join

### approveGroupMember (services/groups.ts)
- → Crea `group_member_approved` notification para el solicitante
- Fire-and-forget — no bloquea el approve

### rejectGroupMember (services/groups.ts)
- → Crea `group_member_rejected` notification para el solicitante
- Fire-and-forget — no bloquea el reject

### setRsvpStatus (services/events.ts)
- → Crea `event_rsvp_changed` notification para el creador del evento
- Solo si `createdBy !== currentUser` (no auto-notificación)
- Fire-and-forget con `void (async () => {...})()`

---

## Contadores sociales

### EventCard.tsx
Nuevas props opcionales (no rompen usos existentes):
- `goingCount?: number` — muestra "N van"
- `maybeCount?: number` — muestra "N quizás"
- `myRsvpStatus?: string` — pill de estado personal (Voy/Quizás/No voy)

### GroupCard.tsx
Nueva prop opcional:
- `pendingCount?: number` — badge "N pendientes" visible solo cuando > 0

---

## Graph Ranking (services/graph.ts)

Nuevas funciones exportadas:

```ts
getTopTopicsForPlace(placeId, limit?)  // alias de getPlaceTopics — top topics rankeados por weight
getTrendingTopics(limit?)               // trending global: weight desc + last_activity_at desc
getPlaceSocialSummary(placeId)         // groupsCount + eventsCount + activeMembersCount + topTopics
getUserGraphSummary(userId?)           // placesVisited + topInterests + connectionsCount
```

**PlaceSocialSummary** tipo nuevo:
- `groupsCount`, `eventsCount`, `activeMembersCount`
- `topTopics: PlaceTopic[]` (top 5)
- `recentActivityAt: string | null`

**UserGraphSummary** tipo nuevo:
- `placesVisited: number`
- `topInterests: UserTopicInterest[]` (top 5)
- `connectionsCount: number`

---

## UI de Notificaciones

### app/(tabs)/notifications.tsx
- Lista scrollable de notificaciones (más reciente primero)
- Items no leídos con fondo verde suave + punto teal
- Badge de conteo en el header cuando hay no leídas
- Botón "Marcar todas leídas"
- Tap en notificación → marca como leída automáticamente
- Empty state + loading state
- Tags por tipo (Grupo, Evento, Moderación, Tendencia)
- Tiempo relativo ("hace 5m", "hace 2h", "hace 3d")

### app/(tabs)/_layout.tsx
- Nuevo tab "Avisos" con `notifications-outline` icon
- Orden: Espacios → Mapa → Lugares → Chats → **Avisos** → Perfil

---

## Archivos creados

- `supabase/notifications.sql` — tabla + índices idempotente
- `supabase/notifications-policies.sql` — RLS policies idempotente
- `types/notifications.ts` — tipos TypeScript
- `services/notifications.ts` — servicio completo
- `scripts/check-notifications.mjs` — schema check (12/12 OK)
- `scripts/qa-notifications.mjs` — 12 tests QA
- `app/(tabs)/notifications.tsx` — UI completa

## Archivos modificados

- `services/groups.ts` — import + hooks en joinGroup, approveGroupMember, rejectGroupMember
- `services/events.ts` — import + hook fire-and-forget en setRsvpStatus
- `services/graph.ts` — 4 nuevas funciones de ranking + 2 nuevos tipos
- `components/EventCard.tsx` — props opcionales goingCount, maybeCount, myRsvpStatus
- `components/GroupCard.tsx` — prop opcional pendingCount
- `app/(tabs)/_layout.tsx` — tab Avisos agregado
- `package.json` — +supabase:apply:notifications, +supabase:check:notifications, +qa:notifications

---

## qa:notifications — 12/12 PASS

| Test | Resultado |
|---|---|
| T1 Table accessible to authenticated user | PASS |
| T2 User A reads own notification | PASS |
| T2 User B cannot read User A's notification (RLS) | PASS |
| T3 Notification starts unread | PASS |
| T3 Mark notification as read | PASS |
| T4 Unread count query works | PASS |
| T5 Mark all read → count = 0 | PASS |
| T6 User B cannot update User A's notification (RLS) | PASS |
| T7 Group join request notification created by actor | PASS |
| T8 RSVP notification created by attendee | PASS |
| T9 Each user only sees own notifications (RLS strict) | PASS |
| T10 Reports table accessible | PASS |

---

## Limitaciones conocidas

- `member_count` en groups: sincronizado via trigger existente, no recalculado en Stage 2D
- `activeUsersCount` en places: calculado, no en tiempo real por WebSocket
- EventCard goingCount/maybeCount: requiere query adicional desde el padre, no incluido en `getEventsByPlace` por defecto
- Notification insert policy: el actor debe ser el usuario autenticado (actor_id = auth.uid()), correcto para todos los flujos actuales

## Push notifications reales

**Quedan para Stage 3:**
- Expo Notifications (token registration, push API)
- Notification channels por plataforma
- Background delivery
- Token storage en Supabase

Los tipos y estructura de `in_app_notifications` están preparados para evolucionar hacia push. La tabla ya tiene `type`, `title`, `body` que mapean directamente a payload de push notification.

---

## Próximo stage sugerido

**Stage 2E o 3A — Real-time counters + push notifications base**
- Supabase Realtime para `in_app_notifications`
- Badge dinámico en tab de Avisos
- Expo Notifications token registration
- Push delivery para group/event notifications
