# Politicas de Seguridad y Moderacion - Aldea

> Documento operativo de Etapa 1C. Resume que se reporta, que pasa con un reporte y como funcionan los bloqueos en Aldea. Acompana al PRD y al ROADMAP. Su objetivo es que la promesa "seguridad desde el dia uno" sea concreta y verificable.

## 1. Principios

- **Lugar primero, persona despues**. La moderacion protege el chat de lugar, no expone identidad.
- **Privacidad por defecto**. Nunca se publica la ubicacion exacta de un usuario. Los reportes no exponen al reportante a la persona reportada.
- **Reglas claras y motivos cerrados**. Los reportes usan motivos predefinidos. Esto facilita revision y desalienta uso abusivo del boton.
- **Defensa en profundidad**. Los filtros de visibilidad se aplican en tres capas: RLS en Supabase, servicio cliente y UI.

## 2. Que se puede reportar

Cualquier persona autenticada puede reportar:

- **Mensajes** del chat de lugar (`reports.target_type = "message"`).
- **Perfiles** de otros usuarios (`reports.target_type = "profile"`).
- A futuro: lugares, grupos y eventos. El esquema ya lo soporta.

Motivos predefinidos disponibles en la UI:

| Motivo | Cuando aplica |
| --- | --- |
| `spam` | Mensajes repetidos, publicidad, enlaces sospechosos. |
| `harassment` | Lenguaje agresivo, amenazas, discriminacion. |
| `inappropriate_content` | Material sexual, violento o ajeno al chat local. |
| `misinformation` | Datos falsos sobre el lugar, eventos o personas. |
| `impersonation` | Cuentas que se hacen pasar por otra persona u organizacion. |
| `unsafe_meetup` | Convocatorias que ponen en riesgo a otras personas. |
| `other` | Casos no cubiertos. Requiere detalle. |

El reporte se guarda con `reporter_id = auth.uid()`, el motivo elegido y un detalle opcional libre.

## 3. Que pasa con un reporte

1. La fila queda registrada en la tabla `reports` con estado inicial `pending` y el motivo + detalle libre.
2. Las cuentas marcadas como moderadoras (`profiles.is_moderator = true`) ven el reporte en la **Bandeja de moderacion** dentro de la app (Perfil > "Bandeja de moderacion", ruta `app/moderation/inbox.tsx`). La bandeja se carga con `listReportsForModeration({ status })` y filtra por estado (`pending`, `reviewed`, `actioned`, `dismissed`, `all`).
3. Desde la bandeja, la persona moderadora puede:
   - Abrir el contenido reportado (perfil/lugar/grupo/evento). Para mensajes de chat, abrir el chat de lugar correspondiente porque no hay deep-link directo al mensaje.
   - Marcar el reporte como `reviewed` (visto, sin accion adicional necesaria todavia).
   - Aplicar accion (`actioned`): advertir al autor, ocultar mensaje (`moderation_status = "hidden"`), suspender cuenta, etc. La accion concreta se realiza fuera de la app cuando haga falta (Supabase, comunicacion al usuario).
   - Descartar (`dismissed`) cuando el reporte no procede.
4. Cada actualizacion guarda `reviewed_by = auth.uid()`, `reviewed_at = now()` y opcionalmente `resolution_note` para trazabilidad.
5. La persona reportada **no** recibe la identidad del reportante. La identidad del reportante solo es visible para moderadoras y para el propio reportante.
6. Permisos en Supabase (RLS):
   - `reports` lectura: `reporter_id = auth.uid()` o `public.is_moderator(auth.uid())`.
   - `reports` insert: cualquier autenticado puede crear (con `reporter_id = auth.uid()`).
   - `reports` update: solo cuentas con `is_moderator = true`.
   - Para promover a un moderador: `update public.profiles set is_moderator = true where id = '<uuid>';` desde el dashboard de Supabase.
7. Cuando exista carga suficiente, se evaluara apoyo de moderacion asistida y notificaciones push (Post-MVP, ver ROADMAP).

## 4. Bloqueos

- Cualquier usuario puede bloquear a otro desde:
  - El mensaje en el chat de lugar (boton `Bloquear`).
  - El perfil ajeno (`/profile/[id]`).
- El bloqueo es **unidireccional desde la base de datos** (`blocks.blocker_id`, `blocks.blocked_id`) pero la RLS de `place_messages` impide ver mensajes en ambos sentidos cuando existe el bloqueo.
- Filtro en cliente adicional en el chat: los mensajes de cuentas bloqueadas no se renderizan y se muestra un aviso `N mensajes ocultos`.
- Se puede desbloquear en cualquier momento desde **Perfil > Mis bloqueos** (`/blocks`).
- Bloquearse a si mismo esta prohibido en el servicio.

## 5. Avisos contextuales (SafetyNotice)

Se muestra el componente `SafetyNotice` en los puntos donde el riesgo es mayor:

- **Chat de lugar**: recuerda no compartir datos sensibles y como reportar o bloquear.
- **Detalle de evento presencial**: tono `event`, recordatorio antes del RSVP con confirmacion explicita.
- **Perfil ajeno**: explica que reportar no expone identidad y que bloquear es reversible.
- **Pantalla Mis bloqueos**: explica como funciona el filtro.

## 6. Rate limit en chat de lugar

Para evitar inundaciones y mensajes repetidos en el chat de lugar aplicamos un limite en dos capas (defensa en profundidad):

- **Cliente** (`services/messages.ts` + `components/MessageInput.tsx`):
  - Maximo 5 mensajes por usuario por ventana movil de 60 segundos.
  - Se rechaza si el cuerpo es identico (normalizado: trim, minusculas, espacios colapsados) al ultimo mensaje enviado.
  - Cuando se supera el limite, el input muestra un cooldown con el tiempo restante y un mensaje claro al usuario.
- **Servidor** (`supabase/triggers.sql`):
  - Trigger `BEFORE INSERT` sobre `place_messages` con las mismas reglas, para que no se pueda eludir desde clientes alternos.
  - Errores se levantan con prefijo `rate_limit_exceeded:` o `duplicate_message:` para que el cliente los traduzca a un aviso amigable.
  - Indice `place_messages_user_created_idx` para que la verificacion por ventana sea barata.

Si se necesita ajustar el limite, los valores viven en `MESSAGE_RATE_LIMIT_MAX` / `MESSAGE_RATE_LIMIT_WINDOW_MS` (cliente) y en la funcion `enforce_place_message_rate_limit` (servidor). Mantener ambos sincronizados.

## 7. Limites tecnicos actuales

- La bandeja de moderacion ya existe dentro de la app, pero todavia no hay notificaciones push o por correo cuando llega un reporte: las moderadoras deben abrir la bandeja periodicamente.
- No hay notificaciones automaticas al reportante. El estado del reporte solo es visible al equipo de moderacion y al propio reportante via consulta.

## 8. Verificacion manual recomendada

1. Iniciar sesion con dos cuentas distintas (A y B).
2. Desde A, enviar un mensaje en un lugar y reportar un mensaje de B con motivo `spam` + detalle.
3. Verificar en Supabase que `reports` tiene la fila con `reporter_id = A`, `target_id = id_mensaje_de_B`, `reason = "spam"`.
4. Desde A, bloquear a B desde el chat y desde el perfil. Confirmar que los mensajes de B desaparecen al instante y aparece el contador de mensajes ocultos.
5. Ir a Perfil > Mis bloqueos, confirmar que B aparece y desbloquear. Los mensajes vuelven a verse.
6. Intentar bloquearse a si mismo: debe fallar con error explicito.
7. Desde A, enviar 6 mensajes seguidos en menos de un minuto: el sexto debe rechazarse con el aviso de rate limit y el input mostrar cooldown.
8. Desde A, enviar dos veces el mismo texto consecutivo: el segundo debe rechazarse con el aviso de duplicado, tanto en cliente como ante un cliente que llame al insert directo.

## 9. Cambios a futuro (fuera de Etapa 1C)

- Bandeja de reportes propios y estado de revision.
- Mute temporal por lugar gestionado por moderadores locales.
- Filtros automaticos basicos (palabras, dominios) antes de moderacion asistida.
- Deteccion de spam coordinada (no solo conteo y repeticion exacta) sobre `place_messages`.
