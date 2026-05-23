# Aldea Technical Architecture

## Stack

- Expo + React Native.
- TypeScript.
- Expo Router.
- Supabase para Auth, Postgres, Realtime y Storage inicial.
- Postgres relacional como base principal.
- Servicios separados por dominio: places, messages, groups, events y profiles.

## Por Que Supabase Primero

Supabase permite validar el MVP con menos infraestructura:

- Auth integrado.
- Postgres relacional.
- Realtime sobre tablas como `place_messages`.
- Storage disponible para avatares o media futura.
- RLS desde el inicio.

Para Etapa 0, la app funciona sin credenciales usando datos mock. Cuando existan `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`, los servicios intentan leer y escribir en Supabase.

## Por Que No Neo4j Todavia

Neo4j no se implementa en esta etapa porque la primera pregunta no es si podemos construir un grafo, sino si las personas quieren conversar dentro del espacio digital de un lugar fisico.

Agregar un grafo completo antes de validar actividad social aumentaria costo y complejidad. El MVP ya guarda relaciones importantes en Postgres:

- Usuario -> lugar.
- Lugar -> mensajes.
- Lugar -> grupos.
- Lugar -> eventos.
- Usuario -> grupo.
- Usuario -> evento.
- Mensaje -> temas.

## Como Se Agregaria Neo4j Despues

Cuando haya uso real, se puede crear un pipeline desde Postgres hacia Neo4j para relaciones derivadas:

```txt
profiles -> VISITED -> places
profiles -> POSTED_IN -> place_messages
groups -> BASED_IN -> places
events -> HOSTED_AT -> places
place_messages -> MENTIONS -> topic_tags
profiles -> MEMBER_OF -> groups
profiles -> ATTENDED -> events
```

Neo4j entraria como motor de consultas relacionales complejas y recomendaciones contextuales, no como storage primario de chat crudo.

## Estructura Del Proyecto

```txt
app/          rutas Expo Router
components/   UI reutilizable
data/         mocks para desarrollo sin Supabase
lib/          cliente Supabase y constantes
services/     capa de datos por dominio
types/        contratos TypeScript
supabase/     schema, seed y policies
docs/         documentacion de producto y arquitectura
```

## Flujo De Datos

1. La pantalla llama a un servicio.
2. El servicio revisa si Supabase esta configurado.
3. Si no hay credenciales, retorna mocks.
4. Si hay credenciales, usa Supabase.
5. La pantalla renderiza estados de carga, vacio o datos.

Ejemplo:

```txt
PlaceChatScreen -> messages.service -> Supabase place_messages o mockMessages
```

## Realtime

La primera tabla preparada para realtime es `place_messages`. El servicio expone:

- `getPlaceMessages(placeId)`
- `sendPlaceMessage(placeId, body)`
- `subscribeToPlaceMessages(placeId, callback)`

En Etapa 1 se debe habilitar `place_messages` en Supabase Realtime y verificar deduplicacion de mensajes al recibir inserts.

## Privacidad

Reglas aplicadas desde Etapa 0:

- No se muestra ubicacion exacta de usuarios.
- La UI muestra actividad agregada por lugar.
- Safety notices aparecen en espacios clave.
- El modo de seguridad sigue modelado en TypeScript y puede persistirse en una iteracion posterior.
- `reports` y `blocks` ya existen en el schema de Etapa 1.

## Decisiones Relevantes

- Mapa real queda como siguiente paso; Etapa 0 usa listado navegable.
- Chat publico por lugar es el primer realtime real a conectar.
- Grupos y eventos tienen pantallas y servicios, pero crear/editar queda para Etapa 1.
- El repositorio estaba vacio, por eso se creo la estructura Expo manualmente.
