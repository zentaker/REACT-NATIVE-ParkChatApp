# Estado actual en Replit

Snapshot del workspace al 23-may-2026.

## Identificacion
- **Proyecto:** Aldea / ParkChat
- **Branch:** `main`
- **Origen GitHub:** `zentaker/REACT-NATIVE-ParkChatApp`
- **Workspace:** Replit

## Workflow
- `Start application` -> `npx expo start --web --port 5000`
- Estado: **running**.

## Validaciones
| Check | Estado |
|---|---|
| `npm run doctor:node` | WARN — `EXPO_PUBLIC_SUPABASE_URL` contiene un JWT en lugar de la URL |
| `npm run typecheck` (`tsc --noEmit`) | OK, 0 errores |
| Preview web | Renderea correctamente (mocks) |
| Post-merge hook (`scripts/post-merge.sh`) | OK (~700-900 ms) |

## Backend
- **Supabase real:** NO conectado.
- **Modo activo:** mocks (fallback automatico del cliente cuando la URL no es
  parseable o no es `*.supabase.co`).
- **Anon key:** valida (JWT presente).
- **Project URL:** invalida (sigue con un JWT pegado en el campo URL).

## Etapas
| Etapa | Estado codigo | QA real |
|---|---|---|
| Etapa 0 - base UI + nav | Hecho | N/A |
| Etapa 1A - auth + places + chat realtime | Hecho | Bloqueado por URL Supabase |
| Etapa 1B - grupos y eventos en UI | Hecho | Bloqueado por URL Supabase |
| Etapa 1C - reportes + bloqueos + rate limit | Hecho | Bloqueado por URL Supabase |
| Etapa 2 / 3 / Post-MVP | No iniciado | - |

## Tasks abiertas
Ver `docs/TASKS_IN_PROGRESS_QA_PLAN.md`. Resumen:
- #6 implemented, #7 merging, #8 in progress.
- #5 y #9 ya mergeadas.

## Bloqueador unico
`EXPO_PUBLIC_SUPABASE_URL` sigue siendo un JWT (`eyJhbGci...`, len=208) en
Replit Secrets. El valor correcto que confirmaste es:

```
https://apcdhwqfntujcwsbtfbu.supabase.co
```

Para corregirlo: Tools -> Secrets -> editar `EXPO_PUBLIC_SUPABASE_URL` ->
borrar el valor actual completo -> pegar la URL de arriba -> Save -> reiniciar
el workflow. `npm run doctor:node` debe dejar de mostrar el WARN.

## Proximo stage
Etapa 1A-QA (este stage). Mientras la URL no se corrija:
- Smoke test contra Supabase: bloqueado.
- Validacion de RLS hostil-intent: bloqueada.
- Tag `v0.1.0`: no crear.

Cuando se corrija:
1. Aplicar SQL segun `docs/SUPABASE_APPLY_SQL.md`.
2. Correr `docs/SMOKE_TEST.md`.
3. Correr `docs/RLS_CHECKLIST.md`.
4. Recien evaluar tag de release.
