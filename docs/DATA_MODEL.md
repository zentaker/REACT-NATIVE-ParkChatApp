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

## Futuro Paso Hacia Grafo Social

Cuando existan datos reales, estas relaciones se pueden proyectar a Neo4j:

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
