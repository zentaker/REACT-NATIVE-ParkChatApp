# Preview Setup

Guia para visualizar Aldea / ParkChat durante el desarrollo en Replit.

## 1. Objetivo

Poder ver la interfaz mobile de la app al costado mientras se trabaja en el
codigo, sin necesidad de un celular fisico ni de tener Supabase configurado.
La app funciona con mocks cuando Supabase no esta conectado.

## 2. Modo 1 — Replit Web Preview

La forma mas comoda durante desarrollo.

### Como activar

El workflow `Start application` ya corre automaticamente:

```
npx expo start --web --port 5000
```

En Replit, el panel Preview del costado muestra la app en modo web.

### Lo que ve el usuario

- La app renderiza centrada con max-width 430px.
- Fondo gris externo neutro (imita entorno de dispositivo).
- La app tiene sombra y se comporta como pantalla de telefono.
- En celular real o pantalla pequena, ocupa el ancho completo normalmente.

### Comandos

```bash
npm run start:web          # inicia (ya lo hace el workflow)
npm run start:web:clear    # si hay problemas de cache
```

## 3. Modo 2 — Expo Go con tunnel

Para probar en celular fisico sin estar en la misma red.

### Como activar

```bash
npm run start:go           # expo start --tunnel
npm run start:go:clear     # con cache limpio
```

Aparece un QR en la terminal. Escanealo con Expo Go (Android) o la camara (iOS).

### Limitaciones en Replit

- El proceso tunnel puede cerrarse si Replit pone el repl en standby.
- Si el QR no aparece en el panel, mirar los logs del workflow en la terminal.
- Usar `start:go:clear` si el bundle tiene errores de cache.
- No dejar dos procesos Expo corriendo al mismo tiempo (uno web, uno tunnel).

## 4. Modo 3 — Replit mobile simulator

No disponible en este tipo de proyecto (Expo sin Android/iOS emulador
configurado en Replit). El preview web cubre el mismo objetivo visual.

## 5. Comandos completos

| Comando | Descripcion |
|---|---|
| `npm run start:web` | Preview web en puerto 5000 (modo desarrollo) |
| `npm run start:web:clear` | Preview web con cache limpio |
| `npm run start:go` | Expo Go con tunnel para celular fisico |
| `npm run start:go:clear` | Expo Go con tunnel y cache limpio |
| `npm run typecheck` | Verifica tipos TypeScript (0 errores esperado) |
| `npm run doctor:node` | Valida entorno, Node, npm y secrets |

## 6. Que hacer si aparece pantalla blanca

1. Revisar logs del workflow en Replit (panel inferior o lateral).
2. Buscar errores rojos en la consola del browser (F12).
3. Correr `npm run start:web:clear` para limpiar cache de Metro.
4. Verificar que typecheck pasa: `npm run typecheck`.
5. Si hay error de importacion, buscar componente nativo sin fallback web.

## 7. Que hacer si Expo cache falla

```bash
npm run start:web:clear
# o manualmente:
npx expo start --web --port 5000 --clear
```

Si el problema persiste, borrar `.expo/` y `node_modules/.cache/`:

```bash
rm -rf .expo node_modules/.cache
npm install
npm run start:web
```

## 8. Que hacer si mapas o componentes nativos no funcionan en web

Los componentes que usan APIs nativas tienen versiones web alternativas:

| Componente | Mobile | Web |
|---|---|---|
| `DateTimeField` | `@react-native-community/datetimepicker` | `<input type="datetime-local">` |
| `MapView` | Mapa nativo (pendiente Etapa 2) | Placeholder / lista de lugares |
| Location | expo-location (pendiente) | No implementado; no requerido en Etapa 1 |

Metro resuelve automaticamente `.web.tsx` sobre `.tsx` cuando corre en web.

## 9. Que hacer si Supabase no esta conectado

La app cae automaticamente a mocks cuando:
- `EXPO_PUBLIC_SUPABASE_URL` no es una URL valida (`https://*.supabase.co`).
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` no esta seteada.

En modo mocks:
- Se muestran lugares de ejemplo (Parque Kennedy, Barranco Plaza, etc.).
- El chat muestra mensajes seed.
- Auth retorna un usuario mock.
- Grupos y eventos tienen datos seed.

El warning `[supabase] Fallback to mocks` aparece en consola del browser.
Esto es esperado y correcto si las credenciales no estan listas.

## 10. Que si valida el preview web

- Navegacion entre tabs.
- Apertura de pantallas principales.
- Flujo visual de Etapa 0, 1A, 1B, 1C con datos mock.
- Layout responsive / mobile frame.
- Renders sin crash, sin pantalla blanca, sin errores JS.
- Typecheck y linting antes de cada PR.

## 11. Que NO valida el preview web

- Backend Supabase real (auth, persistencia, realtime).
- Notificaciones push.
- Location GPS real.
- Mapa interactivo nativo.
- Performance en dispositivo real.
- Comportamiento exacto de iOS / Android (gestos, teclado, etc.).

## 12. Checklist visual

Antes de decir que el preview funciona, confirmar:

- [ ] Workflow `Start application` esta running.
- [ ] Preview panel de Replit muestra la app (no pantalla blanca).
- [ ] Se ven los tabs: Espacios / Mapa / Lugares / Chats / Perfil.
- [ ] Tap en "Espacios" muestra lista de lugares mock.
- [ ] Tap en un lugar abre el detalle.
- [ ] Desde el detalle se puede abrir Chat, Grupos, Eventos.
- [ ] Tab Perfil carga sin error.
- [ ] No aparece error rojo en la pantalla.
- [ ] Consola del browser no muestra errores criticos (solo el warning de mocks es esperado).
