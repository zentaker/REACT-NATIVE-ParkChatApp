# Etapa 1A-QA — Conexion Supabase real, smoke test y RLS

Reporte de la sesion 23-may-2026.

## 1. Configuracion de secrets

| Secret | Estado | Validacion |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | set, **invalido** | Contiene un JWT (`eyJhbGci...`, len=208) en lugar de la URL del proyecto |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | set, valido | JWT presente (len=208) |
| `SUPABASE_SERVICE_ROLE_KEY` | no presente | Correcto: nunca debe estar en el cliente |

Valor confirmado por el usuario para la URL:
`https://apcdhwqfntujcwsbtfbu.supabase.co`. No esta aplicado todavia en
Replit Secrets.

### Acciones del agente
- `lib/supabase.ts` valida estrictamente: exige `https://*.supabase.co` (o
  `http://localhost` en dev) y reporta el motivo exacto del rechazo en consola
  sin imprimir el valor del secret.
- `scripts/doctor-node.mjs` detecta cuando el campo URL contiene un JWT
  (prefijo `eyJ`) y lo marca como WARN, sin imprimir el valor.

### Resultado
Cliente cae a mocks. Backend real NO conectado. **Bloqueador unico para
avanzar el resto de tareas QA.**

## 2. SQL preparado

Archivos listos para aplicar (no aplicados desde Replit):

| Archivo | Estado | Notas |
|---|---|---|
| `supabase/schema.sql` | OK | Tablas, indices, trigger `handle_new_user`, publicacion realtime de `place_messages`. Idempotente. |
| `supabase/profiles-trigger.sql` | OK (creado en esta sesion) | Copia standalone del trigger de auto-creacion de profile. |
| `supabase/triggers.sql` | OK | Rate limit y anti-duplicado en `place_messages` (5/60s + duplicado consecutivo). |
| `supabase/policies.sql` | OK | RLS para todas las tablas del MVP. |
| `supabase/seed.sql` | OK | Places de ejemplo. Opcional. |

Guia de aplicacion: `docs/SUPABASE_APPLY_SQL.md`.

## 3. Smoke test

**Plan:** `docs/SMOKE_TEST.md` (sign-up + profile creation, optimistic send,
two-client realtime, channel cleanup, re-login).

**Estado de ejecucion:** NO ejecutado.

**Razon:** la app esta en mocks porque la URL es invalida. Ejecutar el smoke
test contra mocks no valida nada de Supabase, por lo que se posterga hasta
corregir el secret.

## 4. Realtime test

**Plan:** dos clientes simultaneos en el mismo `place_id`, uno envia y el
otro debe recibir sin refresh; verificar deduplicacion del eco optimista.

**Estado:** NO ejecutado.

**Razon:** misma que el smoke test.

## 5. RLS test

**Plan:** `docs/RLS_CHECKLIST.md` cubre intentos hostiles para cada tabla con
RLS activado (`profiles`, `places`, `place_messages`, `groups`,
`group_members`, `events`, `event_rsvps`, `reports`, `blocks`).

**Estado:** NO ejecutado contra base real.

**Lo que SI esta listo:**
- Policies escritas y revisadas en `supabase/policies.sql`.
- Checklist con 9 grupos de pruebas en `docs/RLS_CHECKLIST.md`.

## 6. Etapa 1B y 1C — revision contra Supabase real

**Estado:** NO validado contra base real.

**Lo que SI esta verificado a nivel codigo:**

Etapa 1B:
- `services/groups.ts` y `services/events.ts` insertan con
  `created_by = auth.uid()`.
- Pantallas de creacion, edicion, borrado, join/leave y RSVP estan wireadas y
  pasan typecheck.
- "Mis grupos" y "Mis eventos" wireados desde `/profile`.

Etapa 1C:
- `services/moderation.ts` expone reporte/bloqueo/listado de bloqueados, sin
  permitir auto-bloqueo.
- `app/place/[id]/chat.tsx` filtra mensajes bloqueados en cliente, muestra
  contador de ocultos, dialogo de reporte con motivos predefinidos.
- `app/blocks.tsx` y `app/profile/[id].tsx` operativas.
- Trigger SQL de rate limit aplicado en `supabase/triggers.sql`.

Validacion contra RLS real queda pendiente hasta corregir la URL.

## 7. Bugs encontrados

| Bug | Origen | Estado |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` aceptado con cualquier `http(s)` | Cliente Supabase v1 de la sesion | Fixed: validacion estricta `*.supabase.co` |
| Validador no explicaba motivo del rechazo | Cliente Supabase v1 de la sesion | Fixed: log detalla longitud, prefijo, host, path |
| `doctor:node` daba "set" sin validar formato | scripts/doctor-node.mjs v1 | Fixed: detecta JWT, protocolo, host y path |
| Layout warnings de rutas `place`/`group`/`event` | `app/_layout.tsx` | Fixed: rutas registradas como `place/[id]`, etc. |
| Post-merge hook no configurado | `.replit` sin `[postMerge]` | Fixed: script y config en su lugar |

## 8. Fixes aplicados en esta sesion

- `lib/supabase.ts` — validacion estricta + log con motivo.
- `scripts/doctor-node.mjs` — detecta JWT-as-URL.
- `supabase/profiles-trigger.sql` — standalone (nuevo).
- `docs/SUPABASE_APPLY_SQL.md` — guia de aplicacion (nuevo).
- `docs/TASKS_IN_PROGRESS_QA_PLAN.md` — plan QA tasks abiertas (nuevo).
- `docs/REPLIT_CURRENT_STATUS.md` — snapshot del workspace (actualizado).
- `docs/ETAPA_1A_SUPABASE_REALTIME_QA.md` — este reporte (nuevo).

## 9. Estado final

- Codigo: listo para Supabase real.
- SQL: listo para aplicar.
- QA contra base real: bloqueado por `EXPO_PUBLIC_SUPABASE_URL` invalido.
- Release: NO crear tag `v0.1.0` hasta cerrar smoke test y RLS.

## 10. Proximo stage

Si el usuario corrige el secret hoy:
- **Etapa 1A-QA (continuar)** — aplicar SQL, correr smoke test, correr RLS
  checklist.
- Despues -> **Etapa 1D — QA tasks #6-#8 contra Supabase real + tag v0.1.0**.

Si el secret no se corrige:
- Stage queda en pausa con este reporte como entrega.
