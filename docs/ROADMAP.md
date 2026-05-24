# Hoja de Ruta Aldea

> Documento maestro de planificación por etapas. Es la referencia única para alinear producto, ingeniería y validación. Evita introducir features fuera de alcance antes de validar la hipótesis principal del MVP.

Documentos relacionados: [PRD_MVP](./PRD_MVP.md), [TECHNICAL_ARCHITECTURE](./TECHNICAL_ARCHITECTURE.md), [DATA_MODEL](./DATA_MODEL.md), [STAGE_0_COMPLETION](./STAGE_0_COMPLETION.md), [ETAPA_1](./ETAPA_1.md).

---

## 1. Resumen Ejecutivo

Aldea es una red social hiperlocal donde cada lugar físico (parque, café, plaza, coworking) tiene su propio espacio digital con chat público, grupos locales y eventos espontáneos. El producto se construye sobre Expo + React Native + TypeScript + Expo Router, con Supabase (Postgres, Auth, Realtime, Storage) como backend.

La hipótesis principal que el MVP debe validar es:

> La gente quiere entrar al espacio digital de un lugar físico y conversar con desconocidos o locales de forma segura.

El flujo central a validar es:

```txt
lugar físico → conversación → grupo/evento
```

Toda decisión de roadmap se mide contra esta hipótesis. Si un trabajo no acerca evidencia sobre este flujo, se posterga.

---

## 2. Principios y No-Objetivos

### Principios

- **Lugar primero, persona después**: la unidad fundamental es el lugar, no el perfil ni el feed.
- **Privacidad por defecto**: nunca se expone ubicación exacta de usuarios; sólo presencia agregada por lugar.
- **Seguridad desde el día uno**: reportes, bloqueos y RLS antes de cualquier crecimiento.
- **Fallback a mocks**: la app debe arrancar y navegarse sin Supabase configurado para no bloquear desarrollo.
- **Stack estable**: Expo, React Native, TypeScript, Expo Router y Supabase. No se cambian sin razón validada.
- **Una capa de datos por dominio**: cada dominio expone su servicio (`services/*.ts`) y la UI no toca Supabase directamente.
- **Validar antes de escalar**: no se construye nada fuera del flujo principal hasta tener señal real de uso.

### No-Objetivos (no se construye antes de validar)

- Neo4j ni ningún grafo social dedicado.
- IA, recomendaciones automáticas o moderación por IA.
- Matching romántico o estética de dating.
- Feed global o timeline transversal entre lugares.
- Monetización, marketplace, pagos o suscripciones.
- Ranking público de usuarios o gamificación.
- Exposición de ubicación exacta de usuarios.
- Notificaciones push masivas o engagement loops agresivos.

---

## 3. Estado Actual del Repositorio

Verificado contra `app/`, `services/`, `supabase/`, `package.json`, `STAGE_0_COMPLETION.md` y `ETAPA_1.md`.

### Etapa 0 — Hecho

- Proyecto Expo + React Native + TypeScript con Expo Router configurado.
- Rutas base creadas: `app/(auth)`, `app/(app)`, `app/(tabs)`, `app/place/[id]`, `app/group/[id]`, `app/event/[id]`.
- Pantallas navegables con datos mock: listado de lugares, perfil de lugar, chat, grupos, eventos, perfil de usuario.
- Componentes reutilizables: `PlaceCard`, `PlaceHeader`, `ChatMessageBubble`, `MessageInput`, `GroupCard`, `EventCard`, `SafetyNotice`, `EmptyState`, `LoadingState`.
- Cliente Supabase en `lib/supabase.ts` leyendo variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Fallback a mocks cuando no hay credenciales.
- Tipos TypeScript para todas las entidades del dominio.
- Configuración para correr en Replit (`scripts/start-replit-expo.js`, `doctor-replit`, `.replit`) y diagnóstico Windows (`doctor:node`).

### Etapa 1A — Hecho (parcial)

- Schema SQL completo en `supabase/schema.sql` (profiles, places, place_messages, groups, group_members, events, event_rsvps, reports, blocks) con índices y trigger `handle_new_user`.
- Políticas RLS en `supabase/policies.sql` para todas las tablas, incluyendo bloqueo de lectura de mensajes de usuarios bloqueados.
- Seed inicial en `supabase/seed.sql` con lugares siempre y grupos/eventos condicionados a la existencia de un perfil.
- Servicios reales por dominio: `services/auth.ts`, `profile.ts`, `places.ts`, `messages.ts`, `groups.ts`, `events.ts`, `moderation.ts`.
- Re-exports de compatibilidad: `*.service.ts` apuntan a los servicios nuevos.
- Auth real con Supabase: rutas `sign-in` / `sign-up` / `login` / `register`, grupo privado `app/(app)` con redirección a `/sign-in` cuando no hay sesión.
- Lectura/escritura real de `place_messages` y suscripción Realtime vía Postgres Changes.
- Persistencia real de `group_members`, `event_rsvps`, `reports` y `blocks` desde los servicios.

### Etapa 1A — Cierre (hecho)

- Realtime de `place_messages` publicado vía `supabase/schema.sql` (bloque idempotente que lo agrega a `supabase_realtime` si la publicación existe).

### Etapa 1D — Release QA y preparación v0.1.0 (hecho — 23-may-2026)

- **qa:smoke 23/23 PASS** — auth, places, chat, reports, blocks, groups, events, RLS.
- **DB automation completo** — 33 RLS policies, triggers, seed via Management API (IPv6 workaround estable).
- **Schema drift corregido** — `services/moderation.ts` (message_id/reported_user_id, role=moderator), `services/groups.ts` (access_level), seed y policies alineados al schema real.
- **Bug crítico resuelto** — `createUserClient()` en scripts usa `global.headers.Authorization` (no `setSession()` asíncrono).
- **Moderation E2E** — inbox, reports, blocks, SafetyNotice. QA_UserA elevado a moderator.
- **Realtime** — canal `place-messages:{placeId}`, filter `place_id=eq.{placeId}`, publicación confirmada en DB. Deduplicación vía sentIdsRef.
- **Rate limit doble capa** — cliente (5 msgs/60s) + trigger servidor (`place_messages_rate_limit BEFORE INSERT`).
- **Geofencing DEFERRED** — `radius_meters` presente en schema; lógica de proximidad planificada para Etapa 2.
- **Security audit** — sin exposición de secrets en código app. Finding medium documentado: `service_role` key en `.replit` `[userenv.shared]` (mecanismo Replit Secrets).
- **Docs creados** — `ETAPA_1D_RELEASE_QA.md`, `RELEASE_V0_1_0_CHECKLIST.md`, `SUPABASE_DB_AUTOMATION.md`.
- **Release readiness: GO** — pendiente aprobación de usuario para tag `v0.1.0`.

### Stage 2E — UX Polish + Pilot Readiness (hecho — 24-may-2026)

- **Design tokens**: `theme/tokens.ts` — colors, spacing, radius, fontSize, fontWeight, semantic.
- **Auth polish**: onboarding hero en sign-in (3 features), labels en campos sign-up, validaciones client-side, privacy notice.
- **Copy limpio**: eliminadas referencias a "Etapa 0", "Etapa 1", "Supabase" en UI visible al usuario final.
- **EmptyState**: nuevas props `icon` (emoji) y `action` (CTA button).
- **ACCESS_LEVEL_LABELS**: acentos correctos ("Público", "Solo invitación", "Requiere aprobación").
- **PlaceCard**: footer "Ver comunidad →", chips stats condicionales, diferenciación visual activo/inactivo.
- **Map**: secciones "Cerca de ti" / "Lugares activos", kicker editorial, LoadingState con label descriptivo.
- **Spaces/index**: kicker "Comunidades locales" (no "Etapa 0"), empty state amigable.
- **Groups/Events**: empty state con icono + CTA a new-group / new-event, subtítulos con copy de producto.
- **Notifications**: iconos por tipo (👋 ✅ ❌ 📅 🚩), unreadDot como badge, header "Avisos", empty state 🔔.
- **Profile**: layout tiled 2x2 para acciones, avatar 64px, safety mode como pill, bio con placeholder italic.
- **Docs**: `STAGE_2E_UX_AUDIT.md`, `PILOT_READINESS.md`, `UX_QA_CHECKLIST.md`, `STAGE_2E_UX_POLISH_REPORT.md`.
- **Validaciones**: typecheck 0 errores, qa:smoke 23/23, qa:graph 23/23, qa:geo 12/12, qa:geofence 15/15, qa:notifications 12/12.

### Etapa 1E — Release v0.1.0 (en proceso — 24-may-2026)

- **Validaciones completas**: `doctor:node` ✅, `supabase:doctor-db` 10/10 ✅, `typecheck` 0 errores ✅, `qa:smoke` 23/23 PASS ✅.
- **Release readiness**: GO ✅ (verificado en `RELEASE_V0_1_0_CHECKLIST.md` §15).
- **Workflow de release**: `.github/workflows/release.yml` existe — trigger `v*`, `permissions: write`, bundle sin secrets/node_modules/.expo.
- **Docs creados**: `docs/RELEASE_V0_1_0_REPORT.md`.
- **BLOQUEADOR OPERACIONAL**: `git push` y `git tag` bloqueados desde Replit (sandbox + timeout de red).
- **Acción manual pendiente del usuario**: `git tag v0.1.0 && git push origin main && git push origin v0.1.0`
- **GitHub Release**: Pendiente — se crea automáticamente via Actions al recibir el tag en GitHub.

### Etapa 1A — Pendiente operativo (fuera de código)

- Verificar en el dashboard Supabase que `supabase_realtime` lista `public.place_messages` (la app no puede crear la publicación si no existe).
- Ejecutar manualmente el checklist de `docs/RLS_CHECKLIST.md` contra el proyecto real.
- Manejo explícito de estados de error y reintento queda como pulido continuo, no bloquea el cierre.

---

## 4. Etapas Futuras

Cada etapa tiene objetivo, alcance, entregables, criterios de aceptación, dependencias y riesgos. Las etapas respetan el stack y los no-objetivos. No hay fechas calendario.

### Etapa 1A — Cierre

**Objetivo**: dejar el backend mínimo real estable y verificable, sin gaps entre lo declarado y lo que funciona.

**Alcance**: terminar lo pendiente de Etapa 1A. No se agregan features nuevas de producto.

**Entregables**:

1. Realtime de `place_messages` activado en Supabase y verificado en dos clientes simultáneos.
2. Dedupe de mensajes en cliente (no duplicar el mensaje propio entre eco optimista e insert remoto).
3. Verificación de creación de perfil al hacer sign-up (trigger + fallback de servicio).
4. Documento corto `docs/SMOKE_TEST.md` con los pasos de validación manual.
5. Cobertura mínima de pruebas de RLS (script SQL o checklist manual reproducible).
6. Manejo de errores y estados vacíos consistentes en `places`, `place/[id]`, `group/[id]`, `event/[id]`.

**Criterios de aceptación**:

- Dos sesiones distintas pueden chatear en el mismo lugar en tiempo real, sin duplicados.
- Sign-up de un usuario nuevo deja un `profiles.row` creado sin intervención manual.
- Intentos hostiles documentados son rechazados por RLS.
- `npm run typecheck` pasa.

**Dependencias**: credenciales reales de Supabase, acceso al dashboard.

**Riesgos**: realtime con costo si se abren muchos canales; mitigación: un canal por lugar activo, baja de suscripción al salir de pantalla.

---

### Etapa 1B — Crear Desde la App (Hecho)

**Objetivo**: habilitar que un usuario real pase de consumir a producir contenido local: crear grupos y eventos desde la UI, manejar membresías y RSVP.

**Estado**: implementado en services `groups.ts` / `events.ts` (create/update/delete/leave/cancelRsvp/getMy*), pantallas `app/place/[id]/new-group.tsx`, `app/place/[id]/new-event.tsx`, `app/group/[id]/new-event.tsx`, `app/group/[id]/settings.tsx` (edit + delete), `app/event/[id]/edit.tsx`, `app/(app)/my-groups.tsx`, `app/(app)/my-events.tsx`. Detalle de grupo y evento muestran join/leave y RSVP/cancelar con estado real.

**Alcance**: formularios y flujos mínimos de creación/edición sobre las tablas ya existentes. Sin chat de grupo todavía.

**Entregables**:

1. Pantalla `crear grupo` desde el perfil de un lugar, con validación básica y `created_by = auth.uid()`.
2. Pantalla `crear evento` desde un lugar o desde un grupo, con `starts_at` obligatorio.
3. Edición y baja de grupos/eventos propios (respetando RLS de `created_by`).
4. Vista de "mis grupos" y "mis eventos" en perfil/tabs.
5. Acciones `unirse` / `salir` de grupo y `RSVP going/maybe/no` con feedback inmediato en UI.
6. Confirmaciones destructivas (salir de grupo, cancelar evento propio).

**Criterios de aceptación**:

- Un usuario puede crear un grupo en un lugar y verlo aparecer en el listado del lugar.
- Un usuario puede crear un evento y otro usuario puede dar RSVP.
- Los listados reflejan membresía y RSVP del usuario actual.

**Dependencias**: Etapa 1A cerrada.

**Riesgos**: ruido por grupos/eventos de prueba; mitigación: límite suave por usuario y `EmptyState` claro.

---

### Etapa 1C — Seguridad y Moderación Usables

**Objetivo**: que la promesa "seguridad desde el día uno" sea operativa en la UI, no sólo en SQL.

**Alcance**: exponer reportes, bloqueos y normas en pantallas; afinar reglas de visibilidad.

**Entregables**:

1. Acción "reportar mensaje" desde `ChatMessageBubble` con motivos predefinidos. ✅
2. Acción "reportar usuario" y "bloquear usuario" desde perfil ajeno (`/profile/[id]`). ✅
3. Filtro efectivo en cliente de mensajes/usuarios bloqueados (además del filtro RLS). ✅
4. Pantalla `mis bloqueos` (`/blocks`) con opción de desbloquear. ✅
5. `SafetyNotice` contextual en chat de lugar y en flujo de evento presencial (con confirmación previa al RSVP). ✅
6. Documento `docs/SAFETY.md` con políticas mínimas (qué se reporta, qué pasa después). ✅
7. Rate limit básico por usuario en envío de mensajes (cliente + verificación servidor a futuro). ⏳ pendiente.

**Criterios de aceptación**:

- Bloquear a un usuario oculta sus mensajes en el chat inmediatamente.
- Un reporte queda registrado en `reports` con `reporter_id = auth.uid()`.
- Las normas mínimas son visibles antes de publicar.

**Dependencias**: Etapa 1B no es bloqueante; puede ir en paralelo.

**Riesgos**: abuso del botón de reporte; mitigación: motivos cerrados y revisión manual mientras el volumen sea bajo.

---

### Etapa 2 — Lugar como Mapa Real

**Objetivo**: reemplazar el listado/placeholder de mapa por un mapa real centrado en presencia agregada por lugar.

**Alcance**: incorporar mapa nativo con marcadores por lugar; sin tracking continuo de usuario.

**Entregables**:

1. Integración de mapa (evaluar `react-native-maps` con Expo) con vista por defecto en la ciudad inicial.
2. Marcadores por lugar con tamaño/color según actividad agregada (cantidad de mensajes recientes, no usuarios).
3. Tap en marcador → preview de lugar → entrada al perfil del lugar.
4. Geolocalización opcional, sólo para centrar el mapa, nunca para publicar la posición del usuario.
5. Estado vacío y modo offline del mapa.
6. Documento corto de privacidad sobre uso de geolocalización del dispositivo.

**Criterios de aceptación**:

- El mapa muestra los lugares de Postgres con su actividad agregada.
- En ningún momento se publica ni se almacena la ubicación exacta del usuario.
- El flujo `mapa → lugar → chat` funciona en device real.

**Dependencias**: Etapa 1A cerrada; lugares reales seedeados.

**Riesgos**: complejidad de mapas nativos en Expo Web; mitigación: degradar a listado en web.

---

### Etapa 3 — Calidad de Conversación

**Objetivo**: mejorar la experiencia conversacional dentro del lugar para sostener uso recurrente.

**Alcance**: hilos ligeros, reacciones, indicadores de presencia agregada, persistencia de borradores. Sin DMs todavía.

**Entregables**:

1. Reacciones simples (emoji set cerrado) sobre `place_messages`.
2. Respuesta a mensaje (quote inline), sin árbol profundo.
3. Indicador de "X personas activas aquí ahora" agregado, sin nombres.
4. Persistencia local del borrador del input por lugar.
5. Carga paginada del histórico de mensajes.
6. Mejoras de accesibilidad básica (tamaños, contraste, labels).

**Criterios de aceptación**:

- Reacciones y quotes funcionan en realtime entre dos clientes.
- El indicador agregado nunca expone identidad ni ubicación.
- El chat soporta historiales de cientos de mensajes sin bloquear UI.

**Dependencias**: Etapa 1A cerrada; idealmente 1B y 1C ya entregadas.

**Riesgos**: presión por agregar DMs; mitigación: mantener fuera de alcance hasta validar el flujo público.

---

### Post-MVP — Sólo Tras Validación

**Objetivo**: evaluar (no comprometer) las siguientes apuestas únicamente después de evidencia real de que el flujo `lugar → conversación → grupo/evento` se sostiene.

**Candidatos a evaluar**:

1. **Grafo social en Neo4j** como capa de lectura analítica sobre Postgres. Se evalúa cuando existan suficientes relaciones `usuario↔lugar`, `usuario↔grupo`, `usuario↔evento` como para que las consultas relacionales en Postgres se vuelvan caras o incómodas.
2. **IA y moderación asistida** para clasificación de reportes, detección de spam y resumen de actividad por lugar. Sólo después de que la moderación humana sea insuficiente.
3. **Recomendaciones contextuales** ("lugares parecidos al tuyo", "grupos que podrían interesarte") apoyadas en el grafo o en embeddings.
4. **Monetización** acotada a creadores de lugares/grupos verificados (membresías, eventos pagos). Nunca antes de validar retención.
5. **Mensajería directa** entre usuarios que ya comparten un grupo/evento, con políticas estrictas de consentimiento.
6. **Expansión multi-ciudad** y herramientas de operador local.

**Criterios para abrir cualquiera de estas líneas**:

- Métricas de Etapa 2/3 sostenidas en al menos una ciudad piloto.
- Carga de moderación que justifique IA, o complejidad de queries que justifique Neo4j.
- Decisión de producto documentada con la evidencia que la respalda.

---

## 5. Tabla Resumen de Etapas

| Etapa | Objetivo | Criterio de salida |
| --- | --- | --- |
| 0 | Esqueleto Expo + mocks navegables | App arranca sin Supabase y navega todo el flujo principal |
| 1A | Backend mínimo real con Supabase | Auth, lectura/escritura y realtime de mensajes verificados end-to-end |
| 1B | Crear grupos y eventos desde la app | Usuario real crea grupo y evento; otro usuario se une / da RSVP |
| 1C | Seguridad y moderación usables | Reportes, bloqueos y normas operativas desde la UI |
| 2 | Mapa real con presencia agregada | Mapa muestra lugares con actividad, sin exponer ubicación de usuarios |
| 3 | Calidad de conversación | Reacciones, quotes, paginación e indicador agregado en producción |
| Post-MVP | Evaluar Neo4j / IA / monetización | Evidencia de retención y carga que justifique cada apuesta |

---

## 6. Mapa de Funcionalidades del MVP por Etapa

| Funcionalidad del PRD | Etapa de entrega |
| --- | --- |
| Auth básica | 1A |
| Datos mock cuando Supabase no está configurado | 0 |
| Listado de espacios cercanos | 0 |
| Perfil de lugar | 0 (UI) / 1A (datos reales) |
| Chat público por lugar (lectura/escritura) | 1A |
| Chat público por lugar (realtime estable) | 1A cierre |
| Perfil básico de usuario | 0 (UI) / 1A (datos reales) |
| Grupos del lugar (listado) | 0 (UI) / 1A (datos reales) |
| Grupos del lugar (crear / unirse desde UI) | 1B |
| Eventos del lugar (listado) | 0 (UI) / 1A (datos reales) |
| Eventos del lugar (crear / RSVP desde UI) | 1B |
| Reportar y bloquear (persistencia) | 1A |
| Reportar y bloquear (acciones en UI) | 1C |
| Niveles de acceso / safety notices | 0 (UI) / 1C (reglas operativas) |
| Mapa real de espacios cercanos | 2B ✅ |
| Reacciones / quotes / presencia agregada | 3 |
| Graph-ready schema (user_places, topic_tags, place_topics) | 2A ✅ |
| Hashtag extraction + topic tagging en mensajes | 2A ✅ |
| Place Detail: temas activos + visitas propias | 2A ✅ |
| Profile: intereses + agregar interés manual | 2A ✅ |
| Geofencing real + nearby places layer | 2B ✅ |
| Location permission UI + distance badges | 2B ✅ |
| Place detail: geospatial context + refined graph insights | 2B ✅ |
| user_connections automáticas (grupo/evento join) | 2C |
| Edge Functions para tagging server-side | 2C |
| Mapa nativo interactivo (react-native-maps) | 2C ✅ |
| Geofenced posting estricto configurable | 2C ✅ |
| QA credentials centralizadas (qa-config.mjs) | 2C ✅ |
| Neo4j sync + traversals multi-hop | 3 |

---

## 7. Riesgos Transversales y Mitigaciones

- **Chats vacíos**: lanzar en pocos lugares piloto a la vez; semilla operativa con organizadores locales antes de abrir.
- **Acoso o stalking**: nunca publicar ubicación exacta de usuarios; bloqueos efectivos en cliente y en RLS; reportes con motivos cerrados.
- **Spam en chats públicos**: rate limit por usuario, reportes, posibilidad de mute por moderador del lugar a futuro.
- **Eventos presenciales inseguros**: `SafetyNotice` obligatorio antes de RSVP, recomendaciones públicas, sin compartir contactos directos en MVP.
- **Costos de realtime**: un canal por lugar activo, baja de suscripción al salir de pantalla, monitoreo de inserts por minuto.
- **Privacidad y secretos**: sólo claves públicas de Supabase en cliente; nunca `service_role` en Expo.
- **Complejidad prematura**: cualquier propuesta de Neo4j, IA o monetización antes de validar se rechaza por defecto y se documenta en Post-MVP.
- **Abuso del fallback a mocks**: garantizar que en build de producción los servicios fallen explícitamente si faltan credenciales, en vez de servir mocks silenciosos.

---

## 8. Métricas de Validación por Etapa

Cada métrica busca evidencia sobre el flujo `lugar → conversación → grupo/evento`. No son OKRs comerciales.

- **Etapa 1A**: % de sign-ups que dejan perfil creado; mensajes entregados en realtime sin duplicación; errores de RLS = 0 en intentos legítimos.
- **Etapa 1B**: número de grupos/eventos creados por usuarios reales (no seed); % de eventos con al menos un RSVP externo al creador.
- **Etapa 1C**: tiempo entre reporte y revisión; % de bloqueos efectivos (mensajes ocultos tras bloqueo).
- **Etapa 2**: % de sesiones que entran a un lugar desde el mapa; cero incidentes de exposición de ubicación de usuario.
- **Etapa 3**: mensajes por sesión activa; retorno al mismo lugar en 7 días.
- **Decisión Post-MVP**: retención semanal por lugar sostenida y carga de moderación o consultas que justifique nueva infraestructura.

---

## 9. Glosario

- **Lugar**: espacio físico persistente registrado en `places` (parque, café, plaza, coworking, etc.). Unidad fundamental del producto.
- **Aldea**: el conjunto de personas, conversaciones, grupos y eventos asociados a un lugar.
- **Grupo local**: comunidad creada alrededor de un lugar (`groups.place_id`), pública por defecto.
- **Evento local**: encuentro con fecha asociado a un lugar y opcionalmente a un grupo (`events`).
- **Safety mode**: modelo en tipos/UI que ajusta la visibilidad de presencia y acciones de seguridad del usuario. Persistencia diferida a una iteración posterior.
- **Access level**: nivel de acceso del usuario a un lugar/grupo (lectura, escritura, moderación). Hoy implícito; se formaliza si Etapa 1C lo requiere.
- **Presencia agregada**: indicador anonimizado de actividad reciente en un lugar (p. ej. "muy activo ahora"), sin exponer identidades ni ubicaciones individuales.
