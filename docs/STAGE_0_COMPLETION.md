# Stage 0 Completion

## Que Se Implemento

- Proyecto Expo + React Native con TypeScript y Expo Router.
- Rutas base de auth, tabs, lugar, grupo y evento.
- Pantallas navegables con datos mock.
- Componentes reutilizables:
  - `PlaceCard`
  - `PlaceHeader`
  - `ChatMessageBubble`
  - `MessageInput`
  - `GroupCard`
  - `EventCard`
  - `SafetyNotice`
  - `EmptyState`
  - `LoadingState`
- Cliente Supabase en `lib/supabase.ts` con variables publicas de Expo.
- Fallback limpio a mocks cuando Supabase no esta configurado.
- Servicios por dominio:
  - `places.service.ts`
  - `messages.service.ts`
  - `groups.service.ts`
  - `events.service.ts`
  - `profiles.service.ts`
- Tipos TypeScript para Place, Profile, PlaceMessage, LocalGroup, LocalEvent, GroupMember, EventAttendee y TopicTag.
- SQL inicial para schema, seed y RLS.
- Documentacion minima de producto, arquitectura y modelo de datos.

## Que Quedo Pendiente

- Instalar dependencias con `npm install`.
- Conectar auth real con Supabase.
- Crear perfiles reales al registrar usuario.
- Habilitar Realtime en Supabase para `place_messages`.
- Reemplazar listado por mapa real.
- Crear grupos y eventos reales desde UI.
- Implementar reportes y bloqueos desde la interfaz.
- Agregar pruebas automatizadas.

## Verificacion En Este Entorno

- Se verifico que existen los archivos requeridos.
- Se verifico que `package.json`, `app.json` y `tsconfig.json` son JSON validos.
- Se verifico que los imports relativos resuelven a archivos existentes.
- No se pudo ejecutar `npm install`, `npm run typecheck` ni `npm run start` porque este entorno no tiene `npm` disponible en PATH.

## Como Correr El Proyecto

```bash
npm install
npm run start
```

Luego abre la app con Expo Go, simulador iOS/Android o el destino que uses en tu entorno.

## Como Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` en el SQL editor.
3. Ejecuta `supabase/policies.sql`.
4. Ejecuta `supabase/seed.sql` para datos iniciales.
5. Copia `.env.example` a `.env`.
6. Completa:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

7. Reinicia Expo.

## Que Esta Usando Mocks

- Lugares cercanos.
- Perfil actual.
- Mensajes de lugar cuando no hay Supabase.
- Grupos por lugar.
- Eventos por lugar.
- Join de grupo/evento retorna una respuesta mock si no hay credenciales.

## Que Queda Listo Para Etapa 1

- Reemplazar mocks por datos reales sin rehacer pantallas.
- Conectar Supabase Auth.
- Guardar y escuchar `place_messages` con Realtime.
- Leer `places`, `local_groups` y `local_events` desde Postgres.
- Crear grupos y eventos reales.
- Implementar reportes y bloqueos basicos usando las tablas existentes.
- Mantener privacidad con presencia agregada y `safety_mode`.

## Riesgos Y Decisiones Tecnicas

- El repositorio estaba vacio, por eso se creo la base Expo manualmente.
- No se implemento Neo4j; Postgres guarda relaciones suficientes para validar el MVP.
- No se muestra ubicacion exacta de usuarios.
- La pantalla de mapa es un placeholder navegable para no bloquear la validacion.
- Las politicas RLS son una base inicial; deben revisarse con casos de abuso antes de produccion.
