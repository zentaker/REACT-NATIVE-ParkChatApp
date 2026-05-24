# Stage 2B — Geospatial Nearby Layer: Plan

## Estado base
- Stage 1 baseline: qa:smoke 23/23 PASS
- Stage 2A graph-ready: check:graph 33/33 PASS
- v0.1.0 tag publicado en GitHub
- expo-location: ~18.1.6 instalado

## Estrategia mobile
Usar `expo-location` para solicitar permiso de ubicación foreground.
Calcular distancias **localmente en el cliente** — no se envían coordenadas exactas a Supabase.
Ordenar lista de lugares por distancia si el permiso está concedido.

## Estrategia web fallback
Web no soporta `expo-location` nativo pero sí `navigator.geolocation`.
La importación dinámica de `expo-location` maneja el fallback automáticamente.
Si el permiso se deniega o no está disponible: mostrar lista normal + CTA de ubicación.

## Riesgos de privacidad
- No se guarda `latitude`/`longitude` exacta del usuario en Supabase.
- No se muestra "usuario X está aquí" ni presencia individual.
- `user_places` guarda solo `relationship_type` + `visit_count` + `last_seen_at` (sin coordenadas).
- `isWithinPlaceRadius` se evalúa solo en cliente.

## Lo que se implementa en Stage 2B
1. `types/location.ts` — UserLocation, LocationPermissionStatus, PlaceWithDistance
2. `services/location.ts` — calculateDistanceMeters, requestLocationPermission, getCurrentLocation, isWithinPlaceRadius, formatDistanceLabel
3. `services/places.ts` — getNearbyPlacesWithDistance, sortPlacesByDistance, annotatePlacesWithDistance
4. `services/graph.ts` — getPlaceGraphInsights, getMyPlaceRelationship, getRelatedTopicsForPlace
5. `components/LocationPermissionCard.tsx`
6. `components/NearbyPlaceBadge.tsx`
7. `app/(tabs)/map.tsx` — lista ordenada por cercanía + badges de distancia
8. `app/place/[id]/index.tsx` — contexto geoespacial seguro + graph insights refinados
9. `scripts/qa-geospatial.mjs` — QA script con 9 casos

## Lo que queda para Stage 2C
- Mapa visual real (react-native-maps)
- Geofenced posting estricto (bloquear acciones fuera del radio)
- Background location (si aplica)
- Modo mapa interactivo

## Lo que queda para Stage 3
- Neo4j para relaciones de grafo complejo
- Matching por proximidad de intereses
- Feed contextual por zona

## Criterios de aceptación
1. qa:smoke 23/23 PASS
2. check:graph 33/33 PASS
3. typecheck 0 errores
4. qa:geo PASS
5. services/location.ts existe con calculateDistanceMeters probado
6. nearby places funciona con y sin permiso
7. web preview no se rompe
8. location permission UI visible
9. places se ordenan por distancia si hay ubicación
10. place detail muestra contexto geográfico seguro
11. user_places se actualiza con visited/active
12. no se guarda ubicación exacta en DB
13. docs actualizadas
