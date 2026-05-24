# Stage 2A — Graph-ready Product Layer: Plan

## Objetivo

Crear una capa graph-ready sobre Supabase/Postgres para modelar relaciones sociales y
contextuales sin introducir Neo4j todavía.

Hipótesis de producto:
> "Cada lugar físico puede tener una comunidad viva: chat local, grupos, eventos
> y relaciones entre personas, temas y espacios."

---

## Por qué Postgres primero y no Neo4j todavía

| Criterio | Postgres | Neo4j |
|---|---|---|
| Costo operativo | 0 extra (ya usamos Supabase) | Instancia dedicada ($$$) |
| Latencia de migración | 0 (ya conectado) | Semanas de ETL y sync |
| RLS nativo | Sí (auth.uid()) | No |
| Consultas de grafo simples | JOINs + CTE | Cypher nativo |
| Consultas de grafo complejas | Limitado | Óptimo |
| Ready para Stage 3 | Sí (schema portable) | Destino final Stage 3 |

**Conclusión**: Stage 2A usa Postgres como "proto-grafo" plano. La estructura de tablas
imita nodos y aristas. Cuando el grafo sea suficientemente complejo para justificar Neo4j,
se migra en Stage 3.

---

## Entidades actuales (Stage 1 baseline)

| Tabla | Descripción | Relaciones existentes |
|---|---|---|
| profiles | Usuarios autenticados | → auth.users |
| places | Lugares físicos | — |
| place_messages | Mensajes de chat por lugar | → profiles, → places |
| groups | Grupos comunitarios | → places, → profiles (created_by) |
| group_members | Membresía en grupos | → groups, → profiles |
| events | Eventos en lugares | → places, → profiles (created_by) |
| event_rsvps | RSVPs de eventos | → events, → profiles |
| reports | Reportes de moderación | → profiles, → place_messages |
| blocks | Bloqueos entre usuarios | → profiles (x2) |

---

## Relaciones que faltan (Stage 2A agrega)

| Relación | Tabla graph-ready | Descripción |
|---|---|---|
| usuario ↔ lugar | user_places | Historial de visitas, tipo de relación |
| mensaje ↔ tema | message_topic_tags | Etiquetado por hashtags |
| tema canónico | topic_tags | Registro de hashtags únicos |
| lugar ↔ tema | place_topics | Peso agregado de temas por lugar |
| usuario ↔ tema | user_topic_interests | Intereses derivados/manuales |
| usuario ↔ usuario (contexto) | user_connections | Señales de co-participación débil |

---

## Tablas Stage 2A

### user_places
Registra cuándo un usuario abre un lugar. Se llama automáticamente desde Place Detail.
- `relationship_type`: visited / active / regular / organizer
- `visit_count`: incrementado en cada visita
- `last_seen_at`: timestamp de última apertura
- **RLS**: usuario solo lee/escribe sus propios registros

### topic_tags
Tabla canónica de hashtags. Creada cuando se usa un hashtag por primera vez.
- `slug`: versión normalizada del nombre (lowercase, sin acentos)
- `name`: nombre original del hashtag
- **RLS**: lectura e inserción para autenticados

### message_topic_tags
Junction: un mensaje puede tener N topic_tags.
- Creada automáticamente al enviar un mensaje con hashtags
- **RLS**: lectura e inserción para autenticados

### place_topics
Agrega el peso de los temas por lugar. Se actualiza al etiquetar mensajes.
- `weight`: suma de usos del tema en el lugar
- `last_activity_at`: timestamp del último uso
- **RLS**: lectura pública para autenticados; inserción/update para autenticados

### user_topic_interests
Intereses del usuario. Derivados automáticamente de hashtags usados, o agregados manualmente.
- `source`: manual / hashtag / derived
- `weight`: número de veces que el usuario usó ese tema
- **RLS**: usuario solo lee/escribe sus propios registros

### user_connections
Señales débiles de co-participación. Se crean cuando dos usuarios comparten un contexto.
- `source`: place / group / event
- **RLS**: usuario solo lee conexiones donde participa

---

## UI nueva en Stage 2A

### Place Detail (`app/place/[id]/index.tsx`)
- Llama `upsertUserPlace` al abrir el lugar → registra visita
- Sección "Temas activos": top place_topics con chips de hashtag + peso
- Sección "Tu relación con este lugar": visit_count, temas activos, grupos

### Profile (`app/(tabs)/profile.tsx`)
- Sección "Mis intereses": chips de user_topic_interests
- Input para agregar interés manualmente

### Messages (`services/messages.ts`)
- `sendPlaceMessage` extrae hashtags del body
- Llama `tagMessage` en background (non-blocking)
- Crea topic_tags, message_topic_tags, place_topics, user_topic_interests

---

## Lo que queda para Stage 3 (Neo4j)

- Traversals de grafo multi-hop (amigos de amigos)
- Recomendaciones de lugares por comunidad
- Detección de comunidades (community detection)
- Ranking de influencia por lugar
- Pathfinding entre usuarios por contexto compartido
- Sincronización Postgres → Neo4j (ETL o CDC)

---

## Scripts de operación

```bash
npm run supabase:apply:graph   # Aplica graph-ready.sql + graph-ready-policies.sql
npm run supabase:check:graph   # Verifica tablas, RLS, policies, indexes
npm run qa:graph               # QA funcional + RLS adversarial (10 tests)
```

---

## Criterios de aceptación Stage 2A

1. qa:smoke 23/23 PASS (Stage 1 intacto)
2. supabase:apply:graph idempotente
3. supabase:check:graph PASS
4. services/graph.ts + types/graph.ts existen
5. user_places se registra al abrir Place Detail
6. hashtags crean topic_tags / message_topic_tags / place_topics
7. Place Detail muestra "Temas activos"
8. Profile muestra "Mis intereses" + input para agregar
9. qa:graph PASS
10. RLS protege datos propios (user_places, user_topic_interests)
11. Sin Neo4j en este stage
