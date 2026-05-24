# Stage 2F — Pilot Analytics + Feedback — Reporte Final

## Estado

| Layer | Estado |
|---|---|
| Stage 1 baseline | PASS |
| Stage 2A graph | PASS |
| Stage 2B geo | PASS |
| Stage 2C map/geofence | PASS |
| Stage 2D notifications | PASS |
| Stage 2E UX polish | PASS |
| Analytics schema (product_events) | DONE |
| Feedback schema (pilot_feedback) | DONE |
| Analytics service | DONE |
| Feedback UI | DONE |
| Pilot dashboard | DONE |
| Retention loop hints | DONE (in-app, no push) |
| qa:analytics | 10/10 PASS |

## Validaciones

| Check | Resultado |
|---|---|
| typecheck | 0 errores |
| qa:smoke | 23/23 PASS |
| supabase:check:graph | 33/33 OK |
| qa:graph | 23/23 PASS |
| qa:geo | 12/12 PASS |
| qa:geofence | 15/15 PASS |
| supabase:check:notifications | 12/12 OK |
| qa:notifications | 12/12 PASS |
| supabase:apply:analytics | OK |
| supabase:check:analytics | 19/19 OK |
| qa:analytics | 10/10 PASS |

## DB nueva

### `product_events`
- id, user_id, event_name, place_id, group_id, app_event_id, topic_tag_id, metadata, session_id, platform, created_at
- RLS: insert/select propio
- 6 índices de rendimiento

### `pilot_feedback`
- id, user_id, place_id, rating (1-5), category, message, created_at
- RLS: insert/select propio
- 3 índices de rendimiento

## UI nueva

- `app/feedback.tsx`: pantalla de feedback con selector de estrellas (1-5), 8 categorías, campo libre, estado success
- `app/pilot/dashboard.tsx`: dashboard de piloto (solo moderadores) con métricas de actividad, conteos por tipo de evento, feedback por categoría
- Botón "💬 Dar feedback del piloto" en perfil (todos los usuarios)
- Botón "📊 Panel de piloto" en perfil (solo moderadores)

## Eventos instrumentados

- `place_viewed` — `app/place/[id]/index.tsx`
- `chat_opened` — `app/place/[id]/chat.tsx`
- `message_sent` — `app/place/[id]/chat.tsx`
- `report_created` — `app/place/[id]/chat.tsx`
- `block_created` — `app/place/[id]/chat.tsx`
- `group_created` — `services/groups.ts`
- `group_joined` — `services/groups.ts`
- `group_approval_requested` — `services/groups.ts`
- `event_created` — `services/events.ts`
- `rsvp_changed` — `services/events.ts`
- `notification_read` — `app/(tabs)/notifications.tsx`
- `feedback_submitted` — `app/feedback.tsx`

## Retention loops (in-app, sin push)

- Profile: si `isModerator` → acceso a dashboard de piloto
- Profile: botón de feedback visible para todos
- Notification tab: trackeo de lecturas → señal de retención
- Empty states con CTA en grupos/eventos → conversión
- Places list: "Lugares activos" → retención geosocial

## Arquitectura de analytics

- **Fire-and-forget**: `trackEvent()` nunca lanza, solo `console.warn` si falla
- **Sin PII en metadata**: solo IDs internos y strings de estado
- **Sin coordenadas**: verificado en qa:analytics TEST 7
- **RLS enforced**: TEST 3 y TEST 5 verifican que user A no puede leer/escribir datos de user B
- **Admin bypass**: service_role puede leer todo para análisis

## Bugs encontrados y fixes

| Bug | Fix |
|---|---|
| `UI_COLORS.card` no existe | Cambiado a `UI_COLORS.surface` |
| `supabase` possibly null en analytics.ts | Añadido guard `!supabase` |
| `supabase` possibly null en feedback.ts | Añadido guards `!supabase` |
| `feedbackButton` style no definido | Añadidos estilos en profile.tsx |

## Known limitations

1. **Dashboard usa solo datos del usuario autenticado** — RLS impide leer eventos de otros usuarios. Para métricas completas del piloto se necesita acceso directo a DB con `service_role`.
2. **Sin push notifications** — los retention loops son solo in-app (por diseño en Stage 2F).
3. **Sin exports CSV** — planeado para Stage 3+.
4. **Sin dashboard web dedicado** — el dashboard es solo la app móvil/web.
5. **Mock mode no trackea analytics** — `!supabase` guard silencia tracking en mock mode.

## Próximo stage

**Stage 2G** — Expo Go mobile pilot validation and v0.2.0 release candidate.
