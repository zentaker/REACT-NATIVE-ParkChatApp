# Etapa 1 - Backend Real Minimo

## Objetivo

Etapa 1 conecta Aldea con Supabase real de forma progresiva, sin romper el fallback a mocks cuando no existen credenciales.

Flujo habilitado:

```txt
Auth real -> perfil -> lugares Postgres -> mensajes realtime -> grupos -> eventos -> reportes/bloqueos
```

## Comandos

```bash
npm install
npm run doctor:node
npm run typecheck
npm run start
```

En este entorno no se pudo ejecutar `npm install` porque `npm` no esta disponible en PATH. La verificacion local realizada cubrio archivos requeridos, JSON valido e imports relativos.

## Problemas Conocidos: npm No Esta En PATH

Si `npm` no resuelve en Windows, primero ejecuta:

```powershell
npm run doctor:node
```

Si `npm` no esta disponible, ejecuta el doctor directamente:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\doctor-node.ps1
```

Guia completa: [WINDOWS_NODE_SETUP.md](./WINDOWS_NODE_SETUP.md).

En este entorno se detecto que `C:\Program Files\nodejs\` existe, pero no esta correctamente priorizado en PATH. Workaround:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm.cmd install
npm.cmd run typecheck
npm.cmd run start
```

## Setup De .env

Copia `.env.example` a `.env` y completa solo claves publicas:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

No uses `service_role` ni secretos privados en Expo.

## Orden Para Ejecutar SQL

1. Ejecuta `supabase/schema.sql`.
2. Ejecuta `supabase/policies.sql`.
3. Crea al menos un usuario desde la app o desde Supabase Auth.
4. Ejecuta `supabase/seed.sql`.

El seed inserta lugares siempre. Los grupos y eventos se insertan solo si existe al menos un perfil, porque `groups.created_by` y `events.created_by` deben apuntar a un usuario real de Supabase Auth.

## Que Funciona Con Mocks

Con `.env` vacio:

- La app arranca en modo mock.
- Las rutas privadas no bloquean el desarrollo.
- Se muestran lugares mock.
- Se muestran mensajes mock.
- Se navega por lugar, chat, grupos, eventos y perfil.
- Join group, RSVP, report y block retornan respuestas mock/noop controladas.

## Que Funciona Con Supabase

Con `.env` configurado:

- Sign-in y sign-up usan Supabase Auth.
- Sign-up intenta crear el perfil y el schema tambien incluye trigger de perfil para usuarios nuevos.
- Las rutas privadas redirigen a `/sign-in` si no hay sesion.
- `places` se leen desde Postgres.
- `place_messages` se leen y escriben desde Postgres.
- `subscribeToPlaceMessages` escucha inserts con Supabase Realtime/Postgres Changes.
- El chat muestra eco optimista del mensaje propio y deduplica contra el evento remoto (ver `services/messages.ts#createOptimisticPlaceMessage` y `app/place/[id]/chat.tsx`).
- `supabase/schema.sql` publica `place_messages` en `supabase_realtime` de forma idempotente.
- Smoke test manual: `docs/SMOKE_TEST.md`. Checklist hostil de RLS: `docs/RLS_CHECKLIST.md`.
- `joinGroup` persiste en `group_members`.
- `joinEvent` persiste en `event_rsvps`.
- `reportContent` persiste en `reports`.
- `blockUser` persiste en `blocks`.
- RLS limita lectura/escritura y bloquea modificaciones ajenas.

## Rutas

Se agrego `app/(app)` como grupo privado y se protegieron tambien los grupos existentes de Etapa 0:

- `app/(tabs)`
- `app/place/[id]`
- `app/group/[id]`
- `app/event/[id]`

Esto evita mover muchas pantallas y mantiene rutas estables mientras se introduce auth real.

## Servicios

Los servicios nuevos son:

- `services/auth.ts`
- `services/profile.ts`
- `services/places.ts`
- `services/messages.ts`
- `services/groups.ts`
- `services/events.ts`
- `services/moderation.ts`

Los archivos `*.service.ts` quedan como compatibilidad y re-exportan los servicios nuevos.

## Limitaciones Conocidas

- El mapa real sigue siendo placeholder.
- La creacion de grupos/eventos desde UI sigue pendiente.
- El chat de grupo y chat de evento siguen como pantallas preparadas.
- Realtime usa Postgres Changes por simplicidad; Broadcast puede evaluarse si escala el volumen.
- El seed de mensajes reales no crea mensajes porque `place_messages.user_id` requiere un perfil real.
- La moderacion sigue siendo basica: reportes, bloqueos y RLS.

## Privacidad

- Se guardan coordenadas de lugares, no de usuarios.
- La UI no muestra ubicacion exacta de personas.
- Los bloqueos se aplican en lectura de mensajes por RLS.
- Reportes y bloqueos solo pueden ser creados por el usuario autenticado.
