# UX QA Checklist — Aldea / ParkChat Stage 2E

Para ejecutar antes de cada piloto o release.

---

## Auth

- [ ] Sign-in muestra onboarding hero (3 features)
- [ ] Sign-in: campos vacíos no disparan request
- [ ] Sign-in: error de credenciales muestra mensaje legible (sin código técnico)
- [ ] Sign-in: botón "Entrando..." durante submit
- [ ] Sign-up muestra privacy notice
- [ ] Sign-up: nombre vacío → alerta "Nombre requerido"
- [ ] Sign-up: contraseña < 6 chars → alerta "Contraseña muy corta"
- [ ] Sign-up: botón "Creando cuenta..." durante submit
- [ ] Sign-up: link "¿Ya tienes cuenta?" navega a sign-in
- [ ] Sign-in: link "¿Eres nuevo?" navega a sign-up

---

## Tabs

- [ ] 6 tabs visibles: Espacios, Mapa, Lugares, Chats, Avisos, Perfil
- [ ] Cada tab carga sin error
- [ ] Tab activo visualmente distinguible
- [ ] Tab Avisos no muestra badge si no hay no-leídas
- [ ] Tab Avisos muestra badge cuando hay no-leídas

---

## Mapa

- [ ] Pantalla carga sin crash (sin ubicación)
- [ ] SafetyNotice de ubicación visible
- [ ] LocationPermissionCard visible si sin permiso
- [ ] Al dar permiso: mapa se actualiza
- [ ] Con ubicación: sección "Cerca de ti" aparece si hay lugares cercanos
- [ ] Sin lugares cercanos: sección "Lugares activos" muestra el resto
- [ ] Sin lugares en absoluto: EmptyState con emoji 🗺️ y mensaje amigable
- [ ] PlacesMapView renderiza sin crash en web
- [ ] PlacesMapView renderiza sin crash en mobile

---

## Espacios (index)

- [ ] Kicker "Comunidades locales" visible (no "Etapa 0")
- [ ] Lista de lugares carga
- [ ] Pull-to-refresh funciona
- [ ] Sin lugares: EmptyState con 🏡 y copy amigable (sin mencionar Supabase)
- [ ] PlaceCard muestra: nombre, tipo, ciudad, actividad, stats, "Ver comunidad →"

---

## PlaceCard

- [ ] Nombre visible y truncado si es largo
- [ ] Tipo · Ciudad visibles
- [ ] Badge activos verde si hay usuarios activos, gris si no
- [ ] Chips de stats solo aparecen si tienen valor > 0
- [ ] "Sé el primero en participar" si no hay actividad
- [ ] "Ver comunidad →" footer siempre visible
- [ ] Pressed state (opacidad) funciona

---

## Detalle de lugar

- [ ] Nombre y tipo del lugar visibles
- [ ] SafetyNotice visible
- [ ] Sección "Contexto geoespacial" muestra estado correcto
- [ ] Con ubicación: distancia y badge cercano/lejos
- [ ] Sin ubicación: hint para activar ubicación
- [ ] CTA "Abrir chat público" navega a chat
- [ ] Tiles Grupos / Eventos muestran contador y navegan
- [ ] Sección "Temas activos" muestra hashtags o hint de uso
- [ ] Sección "Tu relación" muestra visitas si está autenticado
- [ ] Sin autenticación/datos: no crasha, muestra hint

---

## Chat de lugar

- [ ] Mensajes existentes cargan
- [ ] Loading state visible mientras carga
- [ ] EmptyState "Aún no hay mensajes" con descripción amigable
- [ ] Mensajes nuevos aparecen en tiempo real
- [ ] Envío optimista: mensaje aparece antes de confirmación
- [ ] Si falla envío: mensaje optimista se remueve, Alert visible
- [ ] Rate limit: MessageRateLimitError manejado (sin crash)
- [ ] Geofence soft: aviso visible pero se puede escribir
- [ ] Geofence strict: input deshabilitado + aviso coral
- [ ] Mensajes de usuarios bloqueados ocultos
- [ ] Contador "N mensajes ocultos" visible si hay bloqueados
- [ ] Botón "Reportar" funciona y muestra ReportDialog
- [ ] Botón "Bloquear" muestra confirmación antes de bloquear
- [ ] Input ajusta con teclado (KeyboardAvoidingView)

---

## Grupos del lugar

- [ ] Lista de grupos carga
- [ ] Loading state con label
- [ ] Sin grupos: EmptyState con 👥 + CTA "Crear el primer grupo"
- [ ] GroupCard: nombre, nivel de acceso en español correcto
- [ ] GroupCard: badge pendientes si > 0
- [ ] GroupCard: descripción visible si existe
- [ ] GroupCard: contador de miembros
- [ ] Botón "Crear una aldea aquí" navega a new-group
- [ ] CTA en EmptyState navega a new-group

---

## GroupCard — niveles de acceso

- [ ] "Público" (no "Publico")
- [ ] "Solo local" (no "Local")
- [ ] "Solo invitación" (no "Invitacion")
- [ ] "Requiere aprobación" (no "Aprobacion")
- [ ] "Privado"

---

## Eventos del lugar

- [ ] Lista de eventos carga
- [ ] Loading state con label
- [ ] Sin eventos: EmptyState con 📅 + CTA "Crear el primer evento"
- [ ] EventCard: título, fecha formateada, descripción
- [ ] EventCard: nivel de acceso en español con acentos
- [ ] EventCard: RSVP pill si myRsvpStatus definido
- [ ] EventCard: contadores going/maybe si definidos
- [ ] Botón "Crear un encuentro" navega a new-event
- [ ] SafetyNotice "Encuentros presenciales" (tono amber)

---

## Notificaciones / Avisos

- [ ] Pantalla carga sin crash
- [ ] Header "Avisos" visible (no "Notificaciones")
- [ ] Sin notificaciones: EmptyState con 🔔 y mensaje claro
- [ ] Notificaciones listan de más reciente a más antigua
- [ ] Ítem no leído: fondo verde suave + unreadDot rojo
- [ ] Ítem leído: fondo blanco sin dot
- [ ] Emoji por tipo correcto (👋 join, ✅ aprobado, ❌ rechazado, etc.)
- [ ] Tag de categoría con color correcto
- [ ] Tiempo relativo legible ("ahora", "hace 5m", "hace 2h")
- [ ] Tap en ítem no leído → marca como leído
- [ ] Botón "Marcar todas leídas" solo visible si hay no-leídas
- [ ] Al marcar todas: badge del header desaparece
- [ ] Badge header muestra conteo de no-leídas

---

## Perfil

- [ ] Pantalla carga sin crash
- [ ] "Mi perfil" como título (no "Perfil")
- [ ] Sin perfil: EmptyState con 👤 y mensaje amigable (sin "Supabase")
- [ ] Con perfil: avatar con inicial visible
- [ ] Nombre y @username visibles
- [ ] Bio o texto placeholder visible
- [ ] Safety mode como pill (no texto crudo)
- [ ] Sección "Mis intereses" visible
- [ ] Sin intereses: hint de uso de hashtags
- [ ] Con intereses: chips con nombre y peso si > 1
- [ ] Campo agregar interés funcional
- [ ] "Agregar" deshabilitado si campo vacío
- [ ] Grid 2x2 de acciones (Mis grupos, Mis eventos, Bloqueos, Editar perfil)
- [ ] Bandeja de moderación visible solo si isModerator
- [ ] "Cerrar sesión" visible y funciona
- [ ] "Cerrando sesión..." durante el proceso
- [ ] SafetyNotice de privacidad visible

---

## Moderación (si aplica)

- [ ] Solo moderadores pueden acceder a /moderation/inbox
- [ ] RLS impide que usuarios no-moderadores lean todos los reports
- [ ] Reportar mensaje funciona y no crashea
- [ ] Bloquear usuario funciona y filtra mensajes inmediatamente

---

## Web preview

- [ ] App carga en browser (no pantalla blanca)
- [ ] Todos los tabs navegables
- [ ] PlacesMapView.web.tsx no crashea
- [ ] DateTimeField.web.tsx funciona en formularios
- [ ] Chat funciona en web
- [ ] EmptyState renderiza correctamente
- [ ] Sin errores en consola del browser

---

## Mobile (Expo Go)

- [ ] App escanea QR y carga
- [ ] Solicitud de permiso de ubicación aparece
- [ ] Mapa nativo renderiza
- [ ] Chat realtime funciona
- [ ] Teclado no oculta el input de mensaje
- [ ] Gestos de scroll funcionan

---

## Empty states

| Pantalla | Icono | Título | Tiene CTA |
|---|---|---|---|
| Espacios | 🏡 | "Aún no hay lugares" | No |
| Notificaciones | 🔔 | "Aún no hay avisos" | No |
| Grupos | 👥 | "Aún no hay grupos" | Sí → new-group |
| Eventos | 📅 | "Aún no hay eventos" | Sí → new-event |
| Perfil | 👤 | "Sin perfil cargado" | No |
| Chat | — | "Aún no hay mensajes" | No |
| Mapa | 🗺️ | "No hay lugares disponibles" | No |

---

## Loading states

| Pantalla | Label |
|---|---|
| Espacios | "Cargando comunidad" (default) |
| Mapa | "Buscando lugares cercanos..." |
| Grupos | "Cargando grupos" |
| Eventos | "Cargando eventos" |
| Notificaciones | "Cargando avisos" |
| Perfil | "Cargando perfil" |
| Chat | "Cargando chat" |
| Lugar | "Abriendo lugar" |

---

## Error states

- [ ] Chat: fallo de carga → Alert con mensaje legible
- [ ] Login: credenciales incorrectas → Alert sin mensaje técnico
- [ ] Registro: email ya existe → Alert con mensaje legible
- [ ] Block/Report: fallo → Alert con mensaje legible
- [ ] Sin conexión: app no crashea (degradación graciosa)

---

## Accessibility básica

- [ ] Botones tienen `accessibilityRole="button"`
- [ ] Textos de alerta tienen `accessibilityRole="alert"` (SafetyNotice)
- [ ] Inputs tienen placeholder descriptivo
- [ ] Colores no son la única diferencia entre estados (usa texto también)
- [ ] Touch targets ≥ 44pt height (todos los botones tienen minHeight: 48 o más)

---

## Checklist final pre-piloto

- [ ] Todos los items críticos de esta lista: ✅
- [ ] typecheck: 0 errores
- [ ] qa:smoke: 23/23 PASS
- [ ] qa:notifications: 12/12 PASS
- [ ] qa:geo: 12/12 PASS
- [ ] qa:geofence: 15/15 PASS
- [ ] Web preview: sin pantalla blanca
- [ ] Sin texto "Etapa 0", "Etapa 1", "conecta Supabase" en UI
- [ ] Sin secrets en consola
