# Stage 2A — Graph-ready Product Layer: Reporte Final

## Estado

| Componente | Estado |
|---|---|
| Stage 1 baseline (qa:smoke 23/23) | PASS |
| Graph schema (graph-ready.sql) | Aplicado |
| Graph policies (graph-ready-policies.sql) | Aplicado |
| Graph services (services/graph.ts) | Creado |
| Types (types/graph.ts) | Creado |
| Topics (hashtag extraction + tagging) | Activo en sendPlaceMessage |
| User places (upsert en Place Detail) | Activo |
| Place insights UI (Temas activos) | Integrado en app/place/[id]/index.tsx |
| Profile interests UI | Integrado en app/(tabs)/profile.tsx |
| Scripts check + qa | Creados |
| Docs | Actualizados |

---

## Validaciones

| Check | Resultado |
|---|---|
| doctor:node | OK |
| supabase:doctor-db | 10/10 |
| typecheck | 0 errores |
| qa:smoke | 23/23 PASS |
| supabase:apply:graph | OK (idempotente) |
| supabase:check:graph | — (ver ejecución) |
| qa:graph | — (ver ejecución) |

---

## Tablas nuevas

| Tabla | Descripción |
|---|---|
| user_places | Historial de relación usuario-lugar |
| topic_tags | Tags canónicos (hashtags) |
| message_topic_tags | Junction mensaje ↔ topic_tag |
| place_topics | Peso de temas por lugar |
| user_topic_interests | Intereses del usuario |
| user_connections | Señales débiles de co-participación |

---

## UI nueva

| Pantalla | Sección agregada |
|---|---|
| Place Detail (app/place/[id]/index.tsx) | "Temas activos" + "Tu relación con este lugar" |
| Profile (app/(tabs)/profile.tsx) | "Mis intereses" + input para agregar interés |

---

## Archivos creados

- `supabase/graph-ready.sql`
- `supabase/graph-ready-policies.sql`
- `types/graph.ts`
- `services/graph.ts`
- `scripts/check-graph-ready.mjs`
- `scripts/qa-graph-ready.mjs`
- `docs/STAGE_2A_GRAPH_READY_PLAN.md`
- `docs/STAGE_2A_GRAPH_READY_REPORT.md`

## Archivos modificados

- `app/place/[id]/index.tsx` — upsertUserPlace + UI de temas + UI de comunidad
- `app/(tabs)/profile.tsx` — UI de intereses + input para agregar interés manualmente
- `services/messages.ts` — extractHashtags + tagMessage en sendPlaceMessage
- `package.json` — scripts supabase:apply:graph, supabase:check:graph, qa:graph

---

## Flujo de datos (Stage 2A)

```
Usuario abre Place Detail
  → upsertUserPlace(placeId, 'visited')
  → incrementa visit_count, actualiza last_seen_at
  → getPlaceTopics(placeId) → muestra "Temas activos"

Usuario envía mensaje con #hashtag en chat
  → sendPlaceMessage(placeId, body)
  → extractHashtags(body) → ["tennis", "deportes"]
  → tagMessage(messageId, placeId, hashtags) [background, no-blocking]
    → upsert topic_tags (slug único)
    → insert message_topic_tags
    → upsert place_topics (weight++)
    → upsert user_topic_interests (weight++)

Usuario abre Profile
  → getUserTopicInterests() → muestra "Mis intereses"
  → upsertUserTopicInterest(name, 'manual') → agrega interés
```

---

## Limitaciones Stage 2A

- `user_connections` se crea la tabla pero la lógica de inserción automática
  (al unirse a un grupo o RSVP) queda para Stage 2B.
- Hashtag extraction es client-side (regex). En Stage 2B se puede mover a un
  Supabase Edge Function para procesar server-side.
- Sin IA de clasificación de temas todavía.
- Sin Neo4j: todas las consultas son JOINs Postgres.

---

## Próximo stage

**Stage 2B — Geofencing real + mapa de lugares cercanos + graph insights refinados:**
- Detección de proximidad GPS real (geofencing por radius_meters)
- Mapa interactivo de lugares cercanos
- Lógica de user_connections automática (al unirse a grupo/evento)
- Edge Functions para tagging server-side
- Aggregations: top users por lugar, co-participación básica

**Stage 3 — Neo4j (cuando el grafo lo justifique):**
- ETL Postgres → Neo4j
- Traversals multi-hop
- Recomendaciones de comunidad
- Community detection
