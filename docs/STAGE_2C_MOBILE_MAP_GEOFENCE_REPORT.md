# Stage 2C — Mobile Map + Strict Geofence: Reporte Final

## Estado

| Item | Resultado |
|---|---|
| Stage 1 baseline (qa:smoke) | PASS 23/23 |
| Stage 2A graph-ready (check:graph) | PASS 33/33 |
| Stage 2B geo (qa:geo) | PASS 12/12 |
| qa:graph | PASS 23/23 |
| qa:geofence | PASS 15/15 |
| qa:doctor | OK (7 OK, 1 WARN esperado) |
| typecheck | 0 errores |
| react-native-maps | 1.20.1 instalado |

---

## Validaciones

- **doctor:node**: OK
- **supabase:doctor-db**: OK
- **qa:doctor**: OK (WARN esperado: QA_USER_A_EMAIL sin env var — fallback seguro)
- **typecheck**: 0 errores
- **qa:smoke**: 23/23 PASS
- **supabase:check:graph**: 33/33 PASS
- **qa:graph**: 23/23 PASS
- **qa:geo**: 12/12 PASS
- **qa:geofence**: 15/15 PASS

---

## QA Credentials Cleanup

### Antes
Credenciales QA hardcodeadas en 3 scripts independientes:
- `scripts/qa-smoke.mjs` — `const QA_PASSWORD = 'Ald3aQA!2026'`
- `scripts/qa-graph-ready.mjs` — igual
- `scripts/qa-geospatial.mjs` — igual

### Después
Un único punto de verdad: `scripts/lib/qa-config.mjs`

Prioridad:
1. Variables de entorno: `QA_USER_A_EMAIL`, `QA_USER_A_PASSWORD`, `QA_USER_B_EMAIL`, `QA_USER_B_PASSWORD`
2. Fallback a cuentas de test no-privilegiadas si no hay env vars

Los 3 scripts actualizados importan desde `qa-config.mjs`.
`scripts/doctor-qa-secrets.mjs` (`npm run qa:doctor`) valida que no hay leaks de secrets al cliente.

---

## Mapa Visual

### `components/PlacesMapView.tsx` (native)
- Usa `react-native-maps` 1.20.1
- `MapView` centrado en `userLocation` si disponible, o en el primer lugar seed
- `Marker` para cada lugar con color dinámico:
  - Teal = dentro del radio
  - Primary = lugar disponible
- Tap en callout → navega al detalle del lugar
- Fallback de región: Lima (Parque Kennedy)

### `components/PlacesMapView.web.tsx` (web fallback)
- Carga automáticamente en web via Platform split (`.web.tsx`)
- Lista compacta con puntos de color + distancia badge
- Sin dependencias nativas
- Web preview estable

---

## Geofence Estricto Configurable

### `services/geofence.ts`
- `shouldRequireGeofencePosting()` — lee `EXPO_PUBLIC_STRICT_GEOFENCE_POSTING`
- `getGeofenceStatus(userLocation, place)` — devuelve: `inside_radius | nearby | outside | no_location | permission_denied`
- `getGeofenceMessage(status, strictMode)` — mensaje contextual para el usuario
- `canPostInPlaceChat({ userLocation, place, requireInsideRadius })` — decide si puede postear

### Config
- **Por defecto: modo flexible (OFF)** — todos pueden postear sin importar ubicación
- Activar modo estricto: `EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=true`
- Con modo estricto ON: solo usuarios dentro de `radius_meters` pueden enviar mensajes
- QA no se rompe por defecto (flexible mode)

### Integración en `app/place/[id]/chat.tsx`
- Calcula geofence status al cargar el lugar y la ubicación
- Si geofence message existe: muestra notice contextual sobre el input
- Si `canPost = false` (strict ON + fuera del radio): MessageInput queda `disabled`
- Si `canPost = true`: input funciona normalmente
- Actualiza `user_places` con `relationship_type = active` al abrir el chat

---

## Archivos creados

- `scripts/lib/qa-config.mjs` — configuración centralizada de credenciales QA
- `scripts/doctor-qa-secrets.mjs` — doctor para validar seguridad de secrets
- `services/geofence.ts` — lógica de geofence configurable
- `components/PlacesMapView.tsx` — mapa nativo con react-native-maps
- `components/PlacesMapView.web.tsx` — fallback web estable
- `scripts/qa-geofence.mjs` — 15 tests de geofence (todos PASS)
- `docs/STAGE_2C_MOBILE_MAP_GEOFENCE_PLAN.md`
- `docs/STAGE_2C_MOBILE_MAP_GEOFENCE_REPORT.md` (este)

## Archivos modificados

- `scripts/qa-smoke.mjs` — importa desde qa-config.mjs
- `scripts/qa-graph-ready.mjs` — importa desde qa-config.mjs
- `scripts/qa-geospatial.mjs` — importa desde qa-config.mjs
- `app/(tabs)/map.tsx` — integra PlacesMapView + lista completa
- `app/place/[id]/chat.tsx` — integra geofence + upsertUserPlace(active)
- `package.json` — +qa:geofence, +qa:doctor scripts

---

## qa:geofence — 15/15 PASS

| Test | Resultado |
|---|---|
| T1 Inside radius can post (flexible) | PASS |
| T1 Inside radius can post (strict) | PASS |
| T2 Nearby blocked with strict ON | PASS |
| T2 Far blocked with strict ON | PASS |
| T3 Nearby can post (flexible) | PASS |
| T3 Far can post (flexible) | PASS |
| T4 No location blocks with strict ON | PASS |
| T4 No location allows with flexible OFF | PASS |
| T5 Inside radius → no message | PASS |
| T5 Nearby → informative message | PASS |
| T5 Outside → blocking message | PASS |
| T5 Flexible mode → flexible message | PASS |
| T6 user_places has no coordinate columns | PASS |
| T7 Default mode is flexible | PASS |
| T8 Stage 1/2A/2B baseline intact | PASS |

---

## Privacy model

- Coordenadas del usuario **nunca se guardan en Supabase**
- `user_places`: solo `relationship_type`, `visit_count`, `last_seen_at`
- Geofence se evalúa 100% en el cliente
- No se muestra presencia individual ("Sandra está aquí")
- Textos de UI: "Tu ubicación se usa solo para ordenar lugares cercanos. No se comparte ni se guarda."

---

## Known limitations

- MapView en web usa fallback de lista (react-native-maps no corre en web)
- En Expo Go el mapa nativo requiere Development Build para funcionalidades avanzadas
- Background location no implementado
- Geofenced posting estricto está OFF por defecto — activar manualmente con `EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=true`

---

## Activar modo estricto (geofencing real)

Agregar en Replit Secrets o en el entorno:
```
EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=true
```

Con esto activo:
- Usuarios fuera del radio del lugar ven: "Para escribir en este chat debes estar dentro del área del lugar."
- El MessageInput queda deshabilitado
- Usuarios dentro del radio pueden postear normalmente

---

## Próximo stage

**Stage 2D — Notificaciones push + contadores en tiempo real + graph insight ranking**

Objetivos:
- Push notifications para mensajes/eventos (Expo Notifications)
- `activeUsersCount` y `activeConversationsCount` en tiempo real por lugar
- Ranking de place insights (places con más actividad reciente)
- user_connections automáticas al unirse a grupos/eventos
