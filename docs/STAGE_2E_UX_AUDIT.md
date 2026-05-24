# Stage 2E — Auditoría UX

## Pantallas existentes

| Pantalla | Ruta | Estado pre-2E |
|---|---|---|
| Inicio / Espacios | app/(tabs)/index.tsx | Funcional, copy interno ("Etapa 0") |
| Mapa social | app/(tabs)/map.tsx | Funcional, secciones planas sin jerarquía visual |
| Notificaciones | app/(tabs)/notifications.tsx | Funcional, buen estado post-2D |
| Perfil | app/(tabs)/profile.tsx | Funcional, acciones en lista plana |
| Login | app/(auth)/sign-in.tsx | Funcional, sin onboarding hero |
| Registro | app/(auth)/sign-up.tsx | Funcional, sin validaciones client-side |
| Detalle lugar | app/place/[id]/index.tsx | Muy completo, bien estructurado |
| Chat lugar | app/place/[id]/chat.tsx | Completo, realtime, geofence, moderation |
| Grupos del lugar | app/place/[id]/groups.tsx | Funcional, empty state referenciaba "Etapa 1" |
| Eventos del lugar | app/place/[id]/events.tsx | Funcional, empty state referenciaba "Etapa 1" |
| Detalle grupo | app/group/[id]/index.tsx | Funcional |
| Detalle evento | app/event/[id]/index.tsx | Funcional |

---

## Problemas detectados (pre-2E)

### Copy interno expuesto al usuario
- `app/(tabs)/index.tsx`: kicker "Etapa 0" visible en producción
- `app/place/[id]/groups.tsx`: empty state "La Etapa 1 conectara creacion real de grupos con Supabase"
- `app/place/[id]/events.tsx`: empty state "La Etapa 1 conectara creacion real de eventos con Supabase"
- `app/(tabs)/index.tsx`: empty state "Cuando conectes Supabase, apareceran espacios..."
- `app/(tabs)/profile.tsx`: empty state "Conecta Supabase Auth para cargar el perfil real."

### Auth sin onboarding
- `sign-in.tsx`: título + subtítulo directo al formulario, sin propuesta de valor
- `sign-up.tsx`: sin validaciones client-side (contraseña corta, campos vacíos)
- Sin confirmación visual de que la privacidad está protegida al crear cuenta

### ACCESS_LEVEL_LABELS sin tildes/acentos
- "Publico", "Invitacion", "Aprobacion" — texto sin acentos
- Visible en GroupCard y EventCard

### EmptyState sin CTA ni icono
- Solo título + descripción
- No permite al usuario tomar acción directamente desde el estado vacío

### Map con secciones planas
- "Lista de lugares" como título de sección — muy genérico
- Sin diferenciación visual entre lugares cercanos y resto
- Sin editorial header con kicker

### PlaceCard sin CTA explícito
- El usuario no sabe claramente que puede presionar para "entrar" al lugar
- Sin diferenciación entre lugares con/sin actividad

### Perfil con acciones en lista plana
- Todos los botones de acción del mismo tamaño y estilo
- Sin separación visual clara entre identidad / intereses / acciones / salida

### Notificaciones
- Icono del ítem de notificación solo era punto de color, sin emoji representativo
- Empty state sin icono

---

## Empty states faltantes o mejorados

| Pantalla | Estado pre-2E | Estado post-2E |
|---|---|---|
| app/(tabs)/index.tsx | Referencia a Supabase | Emoji + copy amigable |
| app/(tabs)/notifications.tsx | Sin icono | Icono 🔔 + copy claro |
| app/place/[id]/groups.tsx | Referencia a Etapa 1 | Icono 👥 + CTA "Crear el primer grupo" |
| app/place/[id]/events.tsx | Referencia a Etapa 1 | Icono 📅 + CTA "Crear el primer evento" |
| app/(tabs)/profile.tsx | Referencia a Supabase | Icono 👤 + copy genérico |

---

## Loading states

Los loading states existentes son funcionales. `LoadingState` tiene `label` opcional.
No se necesitan cambios de estructura, solo asegurar que se use `label` descriptivo en cada pantalla.

Estado actual:
- map.tsx: `<LoadingState label="Buscando lugares cercanos..." />` ✅ (mejorado)
- groups.tsx: `<LoadingState label="Cargando grupos" />` ✅
- events.tsx: `<LoadingState label="Cargando eventos" />` ✅
- notifications.tsx: `<LoadingState label="Cargando avisos" />` ✅

---

## Error states

No existe un componente `ErrorState` dedicado. Los errores críticos usan:
- `Alert.alert` — correcto para acciones fallidas
- `EmptyState` con título descriptivo — para carga fallida

Pendiente Stage 3: componente `ErrorState` dedicado con reintentar.

---

## Navegación

- Los tabs están bien configurados: Espacios → Mapa → Lugares → Chats → Avisos → Perfil
- La navegación hacia place → chat/groups/events funciona correctamente
- No hay back button explícito en sub-pantallas (manejado por expo-router)
- Place detail tiene CTAs claros hacia chat, grupos, eventos

---

## Oportunidades de look & feel (post-2E)

### Implementadas en Stage 2E
- ✅ Onboarding hero en sign-in (3 features cards)
- ✅ Labels en sign-up (campos con título)
- ✅ Validaciones client-side en sign-up
- ✅ Kicker editorial en sign-in (coral uppercase)
- ✅ Kicker editorial en index.tsx y map.tsx (sin "Etapa 0")
- ✅ EmptyState con icon + action button
- ✅ PlaceCard con "Ver comunidad →" CTA footer
- ✅ PlaceCard diferencia lugares activos vs inactivos visualmente
- ✅ Map secciones "Cerca de ti" vs "Más lugares" / "Lugares activos"
- ✅ ACCESS_LEVEL_LABELS con acentos correctos
- ✅ Groups/Events empty state con CTA y icono
- ✅ Notifications con icono por tipo + empty state 🔔
- ✅ Profile: layout tiled para acciones, avatar más visible
- ✅ Profile: safety mode como pill, no raw text
- ✅ Notificación items: emoji por tipo, unreadDot reposicionado

### Pendiente Stage 3
- Skeleton loaders para listas
- Pull-to-refresh en todas las pantallas (ya existe en index.tsx, extender)
- Avatar de imagen real (actualmente solo inicial)
- Edición de perfil funcional
- Pantalla "Mis grupos" y "Mis eventos" funcionales
- Animaciones de transición entre pantallas
- Dark mode

---

## Qué se implementa en Stage 2E vs Stage 3

### Stage 2E (esta iteración)
- Design tokens (theme/tokens.ts)
- Auth polish + onboarding hero
- EmptyState con action/icon
- Copy limpio (sin referencias a etapas internas ni Supabase)
- PlaceCard editorial (CTA, diferenciación de actividad)
- Map con secciones "Cerca de ti"
- Groups/Events empty state con CTA
- Notifications con iconos por tipo
- Profile con layout tiled
- ACCESS_LEVEL_LABELS con acentos
- Pilot readiness docs

### Stage 3 (próxima iteración)
- Realtime live badge en tab de Avisos
- Skeleton loaders
- Editar perfil funcional
- Pantallas "Mis grupos" y "Mis eventos"
- ErrorState componente
- Dark mode support
- Animaciones
- Push notifications (Expo Notifications)
