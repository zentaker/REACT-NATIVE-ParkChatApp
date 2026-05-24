# Stage 2C — Mobile Map + Strict Geofence: Plan

## Estado base
- Stage 2B geo: qa:geo 12/12 PASS
- expo-location: ~18.1.6
- react-native-maps: 1.20.1 instalado

## Objetivos
1. Centralizar credenciales QA en `scripts/lib/qa-config.mjs`
2. Mapa nativo con react-native-maps + fallback web estable
3. Geofenced posting estricto configurable via env var
4. Integrar geofence en chat de lugar
5. QA completo para geofence logic

## Estrategia de mapa
- **Native (iOS/Android)**: `components/PlacesMapView.tsx` usa react-native-maps
- **Web**: `components/PlacesMapView.web.tsx` (auto-picked by Metro) — lista compacta
- Platform split via `.web.tsx` extension

## Estrategia geofence
- Default OFF: `EXPO_PUBLIC_STRICT_GEOFENCE_POSTING` no definido = modo flexible
- ON: `EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=true` = modo estricto
- Lógica en `services/geofence.ts` — pura TypeScript, sin side effects
- Integración en chat sin romper QA (strict OFF por defecto)

## Privacy constraints
- NO guardar coordenadas en Supabase
- NO mostrar presencia individual
- Geofence evaluado solo en cliente
- user_places: solo relationship_type, visit_count, last_seen_at

## Criterios de aceptación
1. qa:smoke 23/23 PASS
2. check:graph 33/33 PASS
3. qa:graph PASS
4. qa:geo 12/12 PASS
5. qa:geofence PASS
6. qa:doctor OK
7. typecheck 0 errores
8. Credenciales QA centralizadas
9. PlacesMapView existe (native + web fallback)
10. Map tab funciona en web preview
11. Geofence strict OFF = no rompe QA
12. Geofence strict ON = bloquea posting fuera del radio
13. Chat muestra mensajes contextuales de geofence
14. No se guardan coordenadas en DB
