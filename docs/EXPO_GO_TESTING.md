# Expo Go Testing — Stage 2B

## Cómo correr en Expo Go

```bash
npm run start:go
```

Esto abre el servidor de desarrollo de Expo.
Escanea el código QR con la app **Expo Go** en tu dispositivo.

## Probar permiso de ubicación

1. Abre la app en Expo Go.
2. Ve a la pestaña **Mapa** o **Explorar**.
3. Si nunca se pidió permiso, aparece el card `LocationPermissionCard`.
4. Pulsa "Permitir ubicación" — el sistema operativo mostrará el diálogo nativo.
5. Acepta el permiso.
6. La lista de lugares se reordena por distancia.
7. Los badges de distancia aparecen en cada PlaceCard.

## Probar nearby places

1. Con permiso concedido, los lugares más cercanos aparecen primero.
2. Cada lugar muestra distancia aproximada: "a 320 m", "cerca de ti", "a 1.2 km".
3. Si el usuario está dentro del `radius_meters` del lugar, el badge muestra color teal.
4. Sin permiso: la lista se muestra normalmente sin orden por distancia.

## Probar detalle de lugar con contexto geoespacial

1. Abre cualquier lugar.
2. En la sección "Contexto geoespacial" verás:
   - Distancia aproximada (si hay ubicación)
   - Radio del lugar (radius_meters)
   - Estado: "Estás dentro del área" / "Estás cerca" / "Ubicación no disponible"
3. La sección "Tu relación con este lugar" muestra visit_count y last_seen_at.

## Qué no se puede validar bien en web preview

- El diálogo nativo de permiso de ubicación (requiere dispositivo físico o simulador)
- La precisión del GPS (en web usa `navigator.geolocation` con menor precisión)
- Comportamiento de fondo (background location — no implementado en Stage 2B)

## Checklist mobile

- [ ] Permiso de ubicación solicitado correctamente
- [ ] Diálogo nativo del OS aparece
- [ ] Permiso aceptado → lista reordenada
- [ ] Permiso denegado → fallback list + mensaje informativo
- [ ] Badges de distancia visibles en PlaceCards
- [ ] Detalle de lugar muestra distancia
- [ ] `user_places` se actualiza al abrir un lugar
- [ ] Chat de lugar funciona (Stage 1 intacto)
- [ ] Grupos y eventos funcionan (Stage 1 intacto)

## Limitaciones conocidas

- No hay mapa visual interactivo (Stage 2C)
- Geofenced posting estricto no implementado (Stage 2C)
- Background location no implementado
- En web, la precisión de ubicación depende del navegador
