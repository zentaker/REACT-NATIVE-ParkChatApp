# Stage 2D — Social Polish: Plan

## Objetivo
Hacer que ParkChat/Aldea se sienta más social, viva y útil usando la base existente.

## Estado base confirmado
- Stage 1 baseline: qa:smoke 23/23 PASS
- Stage 2A graph-ready: check:graph 33/33 PASS, qa:graph 23/23 PASS
- Stage 2B geospatial: qa:geo 12/12 PASS
- Stage 2C map/geofence: qa:geofence 15/15 PASS

## Datos sociales existentes
- **Events**: `event_rsvps` con status (going/maybe/declined), `events` con created_by, capacity, access_level
- **Groups**: `group_members` con role (owner/admin/member), status (active/pending), `groups` con member_count, access_level
- **Messages**: `place_messages` con rate limiting, hashtag extraction
- **Graph**: `user_places`, `user_topic_interests`, `place_topics`, `user_connections`
- **Moderation**: `reports` con status tracking, `blocks`

## Contadores faltantes (Stage 2D implementa)
- EventCard: going_count, maybe_count, myRsvpStatus
- GroupCard: pendingCount (para owner)
- Notificaciones: unread count en tab

## Notificaciones internas implementadas
- `group_join_request`: usuario B solicita → notifica a owner
- `group_member_approved`: owner aprueba → notifica al solicitante
- `group_member_rejected`: owner rechaza → notifica al solicitante
- `event_rsvp_changed`: usuario cambia RSVP → notifica al creador del evento
- `report_created`, `report_status_changed`: para moderadores
- `geofence_blocked_post`, `topic_trending`: reservados para uso futuro

## Graph insights nuevos
- `getTopTopicsForPlace(placeId, limit)` — top topics por lugar
- `getTrendingTopics(limit)` — trending global por weight + actividad reciente
- `getPlaceSocialSummary(placeId)` — grupos + eventos + members + topics
- `getUserGraphSummary(userId?)` — places visitados + intereses + conexiones

## Criterios de aceptación
1. in_app_notifications tabla existe con RLS
2. qa:smoke 23/23 PASS
3. qa:graph 23/23 PASS
4. qa:geo 12/12 PASS
5. qa:geofence 15/15 PASS
6. qa:notifications PASS
7. typecheck 0 errores
8. Tab de notificaciones visible en app
9. Group join → notificación para owner
10. Approve/reject → notificación para solicitante
11. RSVP change → notificación para creador de evento (fire-and-forget)
12. EventCard muestra goingCount, maybeCount (opcional)
13. GroupCard muestra pendingCount (opcional)
14. No push notifications reales todavía
15. No se guardan coordenadas exactas

## Lo que se deja para Stage 3+
- Push notifications reales (Expo Notifications)
- activeUsersCount en tiempo real por WebSocket
- Neo4j sync + traversals multi-hop
- Moderation inbox automático (webhook o trigger)
- Ranking de places por actividad (requires aggregation views)

## Riesgos
- Notification insert policy (actor_id = auth.uid()): funciona si el actor es el usuario activo que hace la acción
- fire-and-forget RSVP notification: no bloquea la acción principal, falla silenciosamente
- EventCard/GroupCard props opcionales: no rompen usos existentes
