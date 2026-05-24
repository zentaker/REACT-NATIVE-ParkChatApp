# Stage 2F — Analytics Plan

## Objetivo
Preparar ParkChat/Aldea para responder preguntas clave del piloto sin guardar PII
ni ubicaciones exactas, sin romper RLS, y sin bloquear ninguna acción del usuario.

## Preguntas del piloto

| # | Pregunta | Fuente |
|---|---|---|
| 1 | ¿Qué lugares generan más actividad? | product_events.place_id |
| 2 | ¿Qué usuarios vuelven? | product_events.user_id + frecuencia |
| 3 | ¿Qué chats generan conversación? | event: message_sent |
| 4 | ¿Qué grupos/eventos convierten mejor? | group_joined, rsvp_changed |
| 5 | ¿Qué temas están emergiendo? | topic_used, topic_tag_id |
| 6 | ¿Dónde se traban los usuarios? | geofence_blocked |
| 7 | ¿Qué feedback dejan? | pilot_feedback |
| 8 | ¿Qué señales indican retención? | frecuencia de message_sent + place_viewed |

## Eventos instrumentados

| Evento | Cuándo se dispara |
|---|---|
| `place_viewed` | Al abrir detalle de lugar |
| `chat_opened` | Al abrir pantalla de chat |
| `message_sent` | Tras enviar mensaje exitoso |
| `group_created` | Tras crear un grupo |
| `group_joined` | Tras unirse a un grupo (status=active) |
| `group_approval_requested` | Tras solicitar unirse (status=pending) |
| `event_created` | Tras crear un evento |
| `rsvp_changed` | Tras cambiar RSVP |
| `report_created` | Tras reportar contenido |
| `block_created` | Tras bloquear usuario |
| `notification_read` | Tras marcar notificación leída |
| `topic_used` | Cuando se usa un topic/hashtag |
| `geofence_blocked` | Cuando geofence impide posting |
| `feedback_submitted` | Tras enviar feedback de piloto |

## Métricas de piloto

- **DAU/WAU**: frecuencia de events por user_id
- **Retención D7**: users con events en día 1 y día 7
- **Chats activos**: places con más message_sent
- **Conversión de grupos**: group_approval_requested → group_joined
- **RSVP tasa**: rsvp_changed / event_created
- **NPS proxy**: avg(pilot_feedback.rating)
- **Puntos de fricción**: geofence_blocked count
- **Temas emergentes**: topic_used + topic_tag_id

## Qué se mide en DB

- `product_events`: todos los eventos de producto
- `pilot_feedback`: ratings + categorías + mensajes libres

## Qué se deja para herramientas externas (Stage 3+)

- Funnel analysis (Mixpanel / PostHog)
- Heatmaps de sesión
- A/B testing
- Exportación CSV para análisis ad-hoc
- Dashboard web dedicado

## Privacidad

- No se guardan coordenadas exactas
- No se guarda PII en metadata
- metadata es solo: IDs internos, status strings, booleans
- analytics nunca bloquea acción principal (fire-and-forget)
- si trackEvent falla, solo log de warning seguro

## RLS

- `product_events_insert_own`: solo el propio user_id
- `product_events_select_own`: solo ve sus propios eventos
- `pilot_feedback_insert_own`: solo el propio user_id
- `pilot_feedback_select_own`: solo ve su propio feedback
- Admin (service_role) puede leer todo para análisis agregado

## Criterios de aceptación

- [x] product_events existe con RLS
- [x] pilot_feedback existe con RLS
- [x] services/analytics.ts existe y es fire-and-forget
- [x] services/feedback.ts existe
- [x] eventos clave instrumentados
- [x] feedback UI existe en app/feedback.tsx
- [x] pilot dashboard en app/pilot/dashboard.tsx
- [x] qa:analytics 10/10 PASS
- [x] no se guardan coordenadas
- [x] analytics no rompe flujos
- [x] typecheck 0 errores
