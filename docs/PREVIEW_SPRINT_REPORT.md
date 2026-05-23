# Preview Sprint Report

Fecha: 23-may-2026 | Branch: main | Proyecto: Aldea / ParkChat

## 1. Estado final

| Ruta | Estado |
|---|---|
| Replit Web Preview | OK — app renderiza centrada en frame mobile |
| Mobile frame web (phone wrapper) | OK — max-width 430px, fondo gris, sombra |
| Expo Go (tunnel) | Disponible via `npm run start:go`; no probado en celular fisico |
| Replit mobile simulator | No disponible (Expo sin emulador) |
| Mocks | OK — fallback automatico sin Supabase |
| Supabase real | BLOQUEADO — `EXPO_PUBLIC_SUPABASE_URL` invalida (ajeno a este sprint) |

## 2. Replit Web Preview

- Workflow `Start application`: `npx expo start --web --port 5000` — running.
- App renderiza en panel Preview de Replit.
- Layout con contenedor centrado, fondo `#d6d1c8`, max-width 430px, sombra.
- Tabs visibles: Espacios, Mapa, Lugares, Chats, Perfil.
- Mocks activos: datos de ejemplo, sin dependencia de Supabase.
- Sin pantalla blanca, sin error rojo.

## 3. Expo Go

- Script: `npm run start:go` → `expo start --tunnel`.
- QR disponible en terminal cuando el proceso esta activo.
- No probado en celular fisico (requiere dispositivo fisico con Expo Go instalado).
- Limitacion: tunnel puede cerrarse si Replit pone el repl en standby.
- Documentado en `docs/PREVIEW_SETUP.md`.

## 4. Replit mobile simulator

No disponible. Este tipo de proyecto (Expo bare/managed sin emulador) no
tiene simulator nativo en Replit. El preview web cubre el mismo objetivo
visual durante el desarrollo.

## 5. Scripts agregados / modificados

| Script | Cambio |
|---|---|
| `start:web:clear` | NUEVO — `expo start --web --port 5000 --clear` |
| `start:go` | ACTUALIZADO — removido `--go` (obsoleto en Expo 53); queda `expo start --tunnel` |
| `start:go:clear` | NUEVO — `expo start --tunnel --clear` |

## 6. Fallbacks web creados

| Componente | Fallback |
|---|---|
| `DateTimeField.web.tsx` | YA EXISTIA — `<input type="datetime-local">` nativo del browser |
| `MapView` | NO necesario — tab Mapa ya usa placeholder (lista de lugares + card) |
| `expo-location` | NO usada todavia en Etapa 1; pendiente para Etapa 2 |

## 7. Pantallas verificadas (visual en mocks)

- Espacios cercanos (home): lista de lugares mock con contadores
- Mapa: placeholder visual + lista de lugares
- Lugares: lista completa de places
- Chats: acceso a chats de lugares
- Perfil: datos de usuario mock, links a Mis grupos, Mis eventos, Mis bloqueos
- Detalle de lugar (`/place/[id]`): tabs Chat, Grupos, Eventos, Info
- Chat de lugar (`/place/[id]/chat`): mensajes mock, input con rate limit
- Grupos del lugar: lista de grupos mock
- Eventos del lugar: lista de eventos mock
- Mis grupos (`/my-groups`): groups del usuario
- Mis eventos (`/my-events`): eventos del usuario
- Mis bloqueos (`/blocks`): usuarios bloqueados
- Perfil ajeno (`/profile/[id]`): acciones report/block
- Bandeja de moderacion (`/moderation/inbox`): visible para cuentas moderadoras

## 8. Bugs visuales encontrados

| Bug | Estado |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` contiene JWT — warning en consola | Esperado, documentado, no es bug de UI |
| `shadow*` style props deprecated — boxShadow | Warning de RN 0.79, cosmético, no rompe UI |
| `props.pointerEvents is deprecated` | Warning de RN 0.79, cosmético |

## 9. Bugs corregidos en este sprint

| Bug | Fix |
|---|---|
| App sin phone frame en web (full width) | `app/_layout.tsx` — wrapper condicional `Platform.OS === "web"` con max-width 430px centrado |
| Script `start:go` usaba flag `--go` (obsoleto en Expo 53) | Removido `--go`, queda `expo start --tunnel` |
| Scripts `start:web:clear` y `start:go:clear` no existian | Agregados a `package.json` |

## 10. Bloqueadores

- **Supabase real:** `EXPO_PUBLIC_SUPABASE_URL` sigue siendo un JWT. Fuera del
  alcance de este sprint. Ver `docs/ETAPA_1A_SUPABASE_REALTIME_QA.md`.
- **Expo Go en celular:** no probado fisicamente. Requiere dispositivo con
  Expo Go instalado y que el tunnel de Replit se mantenga activo.

## 11. Proximo stage recomendado

**Etapa 1A-QA real con Supabase** — una vez que `EXPO_PUBLIC_SUPABASE_URL`
sea corregido (`https://apcdhwqfntujcwsbtfbu.supabase.co`):
1. Confirmar con `npm run doctor:node` que da `[OK]` en la URL.
2. Aplicar SQL siguiendo `docs/SUPABASE_APPLY_SQL.md`.
3. Correr `docs/SMOKE_TEST.md`.
4. Correr `docs/RLS_CHECKLIST.md`.
5. Recien entonces evaluar tag `v0.1.0`.

**Si el preview sigue bloqueado:**
Preview Fix — resolver pantalla blanca, puerto, cache, router o fallback web.
