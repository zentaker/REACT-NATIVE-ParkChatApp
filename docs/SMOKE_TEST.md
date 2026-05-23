# Smoke Test Manual - Etapa 1A

> Pasos reproducibles para validar el cierre de Etapa 1A: auth real, perfil creado, lectura/escritura de mensajes y realtime sin duplicados.

## Prerrequisitos

1. Proyecto Supabase con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` configurados en `.env`.
2. Haber ejecutado en orden:
   - `supabase/schema.sql`
   - `supabase/policies.sql`
   - `supabase/seed.sql` (opcional para tener lugares)
3. Realtime habilitado para `place_messages`. El `schema.sql` incluye un bloque que lo publica automáticamente en `supabase_realtime` si la publicación existe. Verificar en el dashboard:
   - Database -> Replication -> `supabase_realtime` -> `place_messages` debe aparecer como published.
4. App levantada: `npm run start` (o `npm run start:web`).

## 1. Sign-up crea perfil

1. Abrir la app sin sesión activa.
2. Ir a `sign-up`, registrar un usuario nuevo con email + password + display name.
3. Esperar a que la app entre al stack autenticado.
4. En el dashboard Supabase -> Table Editor -> `profiles`:
   - Debe existir exactamente una fila con `id = auth.users.id` del usuario recién creado.
   - `display_name` debe coincidir con el ingresado.
5. Si por algún motivo el trigger `handle_new_user` no corrió (proyecto antiguo, función deshabilitada), el fallback en `services/auth.ts` ejecuta un `upsert` contra `profiles` justo después del sign-up. La fila debe aparecer igual.

**Resultado esperado**: 1 fila en `profiles` por cada sign-up nuevo, sin intervención manual.

## 2. Lectura inicial de mensajes

1. Con sesión iniciada, navegar a un lugar del listado (`/place/[id]/chat`).
2. La pantalla debe mostrar el `LoadingState` y luego:
   - El historial real desde `place_messages` ordenado por `created_at` ascendente, o
   - `EmptyState` "Aun no hay mensajes" si no hay datos.
3. No deben aparecer mensajes de `mockMessages` cuando Supabase está configurado y respondió OK.

## 3. Envío con eco optimista

1. En el mismo chat, escribir un mensaje y enviarlo.
2. El mensaje debe aparecer inmediatamente (eco optimista, antes de que responda el servidor).
3. Cuando el insert remoto resuelve, el mensaje optimista se reemplaza por el real (mismo body, mismo autor, id de Postgres).
4. **No debe duplicarse** aunque el evento de Postgres Changes llegue después del `insert ... select ... single()`.
5. Repetir 3-4 veces seguidas; ningún mensaje debe quedar duplicado.

## 4. Realtime entre dos clientes

1. Abrir dos clientes simultáneos (ej. dos navegadores, o navegador + Expo Go) con dos cuentas distintas autenticadas.
2. Ambos entran al mismo lugar.
3. Cliente A envía un mensaje. Cliente B debe verlo aparecer en menos de ~2s sin recargar.
4. Cliente B responde. Cliente A debe verlo aparecer también sin recargar.
5. En cada cliente, el mensaje propio aparece una sola vez (eco optimista dedupeado contra el evento de Postgres Changes), y el mensaje del otro aparece una sola vez (solo vía realtime).

## 5. Salida limpia de canal

1. Salir del chat (back / cambiar de pantalla).
2. Volver al chat. No debe haber canales duplicados ni mensajes duplicados al volver a cargar.
3. En el dashboard -> Logs -> Realtime, no debe acumularse un canal por cada navegación (un canal por lugar activo).

## 6. Sign-out / sign-in distinto

1. Cerrar sesión.
2. Iniciar sesión con otra cuenta.
3. El chat sigue funcionando con el nuevo `auth.uid()`; los mensajes enviados quedan atribuidos al nuevo usuario.

## Checklist final

- [ ] `npm run typecheck` pasa.
- [ ] Sign-up nuevo deja `profiles.row` creado.
- [ ] Eco optimista visible y sin duplicado al confirmar.
- [ ] Realtime entre dos clientes funciona en ambas direcciones.
- [ ] Checklist de RLS de `docs/RLS_CHECKLIST.md` ejecutado sin falsos positivos.
