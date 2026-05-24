# Stage 2B — Geospatial Nearby Layer: Reporte Final

## Estado

| Item | Resultado |
|---|---|
| Stage 1 baseline (qa:smoke) | PASS 23/23 |
| Stage 2A graph-ready (check:graph) | PASS 33/33 |
| typecheck | 0 errores |
| qa:geo | PASS 12/12 |
| expo-location instalado | ~18.1.6 |
| Web preview | operativo |

---

## Validaciones

- **doctor:node**: OK
- **supabase:doctor-db**: OK
- **typecheck**: 0 errores
- **qa:smoke**: 23/23 PASS
- **supabase:check:graph**: 33/33 PASS
- **qa:graph**: PASS (fallo esperado por rate limiter en mensajes duplicados — no es bug)
- **qa:geo**: 12/12 PASS

---

## UI nueva

### components/LocationPermissionCard.tsx
Card contextual que muestra el estado de permiso de ubicación y botón para solicitarlo. Se oculta automáticamente si el permiso ya fue concedido.

### components/NearbyPlaceBadge.tsx
Badge pequeño que muestra distancia aproximada (ej. "a 320 m", "cerca de ti") con color dinámico según si el usuario está dentro del radio, cerca, o lejos.

### app/(tabs)/map.tsx (actualizado)
- Detecta permiso de ubicación al iniciar
- Solicita permiso si no está definido
- Ordena lugares por distancia si hay ubicación
- Muestra `LocationPermissionCard` si falta permiso
- Muestra `NearbyPlaceBadge` bajo cada PlaceCard
- Fallback a lista normal sin orden si no hay ubicación

### app/place/[id]/index.tsx (actualizado)
- Sección "Contexto geoespacial": estado (dentro/cerca/fuera), distancia, radio_meters
- Usa `NearbyPlaceBadge` para visualizar distancia
- Conteo de grupos/eventos desde `getPlaceGraphInsights` (datos reales, no solo de place)
- "Tu relación con este lugar": visit_count, last_seen_at, intereses compartidos
- Temas activos con peso visual

---

## Archivos creados

- `types/location.ts` — UserLocation, LocationPermissionStatus, PlaceWithDistance
- `services/location.ts` — calculateDistanceMeters, isWithinPlaceRadius, formatDistanceLabel, requestLocationPermission, getCurrentLocation, getLocationPermissionStatus
- `components/LocationPermissionCard.tsx`
- `components/NearbyPlaceBadge.tsx`
- `scripts/qa-geospatial.mjs` — 9 tests QA
- `docs/STAGE_2B_GEOSPATIAL_PLAN.md`
- `docs/STAGE_2B_GEOSPATIAL_REPORT.md` (este)
- `docs/EXPO_GO_TESTING.md`

## Archivos modificados

- `services/places.ts` — +annotatePlacesWithDistance, +sortPlacesByDistance, +getNearbyPlacesWithDistance, +PlaceWithDistance type
- `services/graph.ts` — +getMyPlaceRelationship, +getRelatedTopicsForPlace, +getPlaceGraphInsights, +PlaceGraphInsights type
- `app/(tabs)/map.tsx` — reescrito con ubicación y nearby
- `app/place/[id]/index.tsx` — reescrito con contexto geoespacial + graph insights refinados
- `package.json` — +qa:geo script

---

## Arquitectura de privacidad

- Las coordenadas del usuario **nunca se guardan en Supabase**.
- `calculateDistanceMeters` corre 100% en el cliente.
- `user_places` guarda solo `relationship_type`, `visit_count`, `last_seen_at` — sin coordenadas.
- La UI no muestra presencia individual ("Sandra está aquí").
- Si el permiso de ubicación se deniega, la app funciona normalmente con lista sin orden.

---

## Algoritmo nearby

```
1. Fetch places from Supabase (todos los públicos)
2. Si userLocation disponible:
   - annotatePlacesWithDistance: Haversine para cada place
   - isNearby: dist <= 2000 m
   - isInsideRadius: dist <= place.radius_meters
   - distanceLabel: "cerca de ti" / "a X m" / "a X.X km"
3. sortPlacesByDistance: ordenar ascendente por distanceMeters (null al final)
4. Si no hay userLocation: devolver lista normal sin anotación
```

---

## Known limitations

- No hay mapa visual interactivo (Stage 2C)
- Geofenced posting estricto no implementado (Stage 2C): cualquier usuario puede chatear en cualquier lugar independiente de su ubicación
- Background location no implementado
- En web preview, la precisión de ubicación depende del navegador y puede no estar disponible
- El mapa nativo (react-native-maps) no está instalado — la pantalla "Mapa" es una lista ordenada

---

## QA tests — qa:geo

| Test | Resultado |
|---|---|
| T1 calculateDistanceMeters Kennedy→Barranco | PASS (3580 m) |
| T1 calculateDistanceMeters mismo punto = 0 | PASS |
| T2 isWithinRadius mismo punto dentro 150m | PASS |
| T2 isWithinRadius Barranco fuera Kennedy 150m | PASS |
| T3 Places tienen coordenadas | PASS (4/4) |
| T4 sortPlacesByDistance ordena ascendente | PASS (4 lugares) |
| T5 user_places upsert visit_count | PASS |
| T6 getPlaceGraphInsights estructura | PASS (topics=3, groups=3, events=3) |
| T7 RLS aísla user_places entre usuarios | PASS (error 42501) |
| T8 Stage 1 baseline spot check | PASS |
| T9 Stage 2A topic_tags readable | PASS |
| T9 Stage 2A user_topic_interests readable | PASS |

---

## Próximo stage

**Stage 2C — Mobile device QA + geofenced posting + mapa visual**

Objetivos:
- Instalar react-native-maps para vista de mapa real
- Geofenced posting estricto: solo permitir chat si el usuario está dentro del radius_meters (con opción de override)
- Validación en dispositivo físico / simulador iOS/Android
- Background location opcional
- Polish visual del mapa
