# Aldea Data Model

## Vision General

El modelo inicial usa Postgres para validar relaciones sociales basicas sin introducir un grafo dedicado. Cada tabla representa una entidad o relacion del flujo:

```txt
lugar -> mensaje -> grupo/evento
```

## Tablas

### profiles

Perfil publico minimo del usuario. El modo de seguridad sigue en tipos y UI, y puede persistirse despues.

### places

Espacios fisicos persistentes: parques, plazas, cafes, coworkings, barrios y otros lugares.

### place_messages

Mensajes del chat publico de un lugar. El chat crudo vive aqui, no en un grafo.

### groups

Grupos creados alrededor de un lugar. Incluyen `visibility` para separar grupos publicos de futuras variantes privadas.

### group_members

Relacion usuario-grupo con rol.

### events

Eventos creados desde un lugar o grupo.

### event_rsvps

Relacion usuario-evento con estado de asistencia.

### reports

Reportes de seguridad sobre usuarios, mensajes o lugares.

### blocks

Bloqueos directos entre usuarios.

## Relaciones Principales

```txt
places.id -> place_messages.place_id
profiles.id -> place_messages.user_id
places.id -> groups.place_id
profiles.id -> groups.created_by
groups.id -> group_members.group_id
profiles.id -> group_members.user_id
places.id -> events.place_id
groups.id -> events.group_id
events.id -> event_rsvps.event_id
profiles.id -> event_rsvps.user_id
```

## Relaciones Relacionales Que Ya Guardan Valor De Grafo

- Un usuario visito o estuvo activo en un lugar.
- Un lugar tiene conversaciones.
- Una conversacion menciona temas.
- Un grupo pertenece a un lugar.
- Un evento ocurre en un lugar.
- Un evento puede asociarse a lugar o grupo; el origen desde mensaje queda para una iteracion posterior.
- Un usuario puede ser miembro de un grupo.
- Un usuario puede asistir a un evento.
- Un usuario puede bloquear o reportar a otro.

## Stage 2A — Tablas Graph-ready (Postgres proto-grafo)

Agregadas sin romper las 9 tablas base. Modelan relaciones sociales sin Neo4j.

### user_places
Historial de relación usuario-lugar. Registrado automáticamente al abrir Place Detail.
- `relationship_type`: visited / active / regular / organizer
- `visit_count`, `last_seen_at`
- **RLS**: usuario solo lee/escribe sus propios registros

### topic_tags
Tags canónicos (hashtags). Creados la primera vez que se usa un hashtag en chat.
- `slug`: versión normalizada (lowercase, slugificada)

### message_topic_tags
Junction: mensaje ↔ topic_tag. Creada al etiquetar mensajes con hashtags.

### place_topics
Peso agregado de temas por lugar. Se actualiza con cada mensaje etiquetado.
- `weight`: suma de usos del tema en el lugar

### user_topic_interests
Intereses del usuario, derivados de hashtags usados o agregados manualmente.
- `source`: manual / hashtag / derived

### user_connections
Señales débiles de co-participación (tabla creada, lógica de inserción en Stage 2B).
- `source`: place / group / event

## Relaciones Stage 2A

```txt
profiles.id -> user_places.user_id
places.id -> user_places.place_id

place_messages.id -> message_topic_tags.message_id
topic_tags.id -> message_topic_tags.topic_tag_id

places.id -> place_topics.place_id
topic_tags.id -> place_topics.topic_tag_id

profiles.id -> user_topic_interests.user_id
topic_tags.id -> user_topic_interests.topic_tag_id

profiles.id -> user_connections.user_a / user_b
```

## Futuro Paso Hacia Grafo Social (Stage 3)

Cuando el grafo sea suficientemente complejo, estas relaciones se migran a Neo4j:

```txt
(:User)-[:VISITED]->(:Place)
(:User)-[:POSTED]->(:Message)
(:Message)-[:IN_PLACE]->(:Place)
(:Message)-[:MENTIONS]->(:Topic)
(:Group)-[:BASED_IN]->(:Place)
(:Event)-[:HOSTED_AT]->(:Place)
(:Event)-[:CREATED_FROM]->(:Message)
(:User)-[:MEMBER_OF]->(:Group)
(:User)-[:ATTENDED]->(:Event)
```

Neo4j debe entrar como lectura analitica/recomendaciones, no como fuente de verdad para mensajes.
