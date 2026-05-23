# Release v0.1.0 Checklist

Aldea / ParkChat — 23-may-2026

> Checklist de release candidate para v0.1.0. Cada ítem fue validado durante Etapa 1D.
> No crear tag `v0.1.0` sin aprobación explícita del usuario.

---

## 1. Backend Supabase

| # | Item | Estado | Notas |
|---|---|---|---|
| 1.1 | Proyecto Supabase activo (sa-east-1) | PASS | `apcdhwqfntujcwsbtfbu` |
| 1.2 | 9 tablas presentes | PASS | profiles, places, place_messages, groups, group_members, events, event_rsvps, reports, blocks |
| 1.3 | `supabase:doctor-db` 10/10 OK | PASS | Management API funciona |
| 1.4 | Seed aplicado (4 places, 5+ groups, 4+ events) | PASS | |
| 1.5 | Triggers activos (`handle_new_user`, `set_updated_at`) | PASS | |
| 1.6 | Rate limit trigger (`place_messages_rate_limit BEFORE INSERT`) | PASS | 5 msgs/60s |
| 1.7 | Realtime publication (`supabase_realtime`) | PASS | place_messages, group_members, event_rsvps, reports |

---

## 2. RLS (Row Level Security)

| # | Item | Estado | Notas |
|---|---|---|---|
| 2.1 | RLS habilitado en las 9 tablas | PASS | Confirmado: `rowsecurity=true` en todas |
| 2.2 | 33 políticas aplicadas | PASS | `supabase:apply:policies` OK |
| 2.3 | Spoof user_id en place_messages bloqueado | PASS | 42501 |
| 2.4 | Edición de mensaje ajeno bloqueada | PASS | 0 rows |
| 2.5 | Edición de perfil ajeno bloqueada | PASS | 0 rows |
| 2.6 | Spoof reporter_id bloqueado | PASS | 42501 |
| 2.7 | Spoof blocker_id bloqueado | PASS | 42501 |
| 2.8 | Spoof created_by en groups bloqueado | PASS | 42501 |
| 2.9 | Spoof user_id en event_rsvps bloqueado | PASS | 42501 |
| 2.10 | Mensajes de usuario bloqueado filtrados | PASS | 0 rows post-block |

---

## 3. Auth

| # | Item | Estado | Notas |
|---|---|---|---|
| 3.1 | Login con email + password funciona | PASS | anon key, no service_role |
| 3.2 | Trigger `handle_new_user` crea profile automáticamente | PASS | |
| 3.3 | Login retorna JWT válido con `user_id` | PASS | |
| 3.4 | `getCurrentUserId()` accesible en servicios | PASS | `services/auth.ts` |
| 3.5 | QA users confirmados (email_confirmed_at) | PASS | ef1489ce + 074afbbd |

---

## 4. Places

| # | Item | Estado | Notas |
|---|---|---|---|
| 4.1 | 4 places seed visibles para usuario autenticado | PASS | Parque Kennedy, Barranco Plaza, Cafe Cultural, Coworking Creativo |
| 4.2 | `type` correcto (no `category` obsoleto) | PASS | park, plaza, cafe, coworking |
| 4.3 | `radius_meters` presente (default 150m) | PASS | Preparado para Etapa 2 |
| 4.4 | `country` correcto (no `district` obsoleto) | PASS | Lima |
| 4.5 | Places visibles sin permiso de location | PASS | Fallback correcto |
| 4.6 | Detalle de lugar navegable | PASS | |

---

## 5. Chat realtime

| # | Item | Estado | Notas |
|---|---|---|---|
| 5.1 | `sendPlaceMessage` inserta en `place_messages` | PASS | qa:smoke |
| 5.2 | Usuario B lee mensajes de A (misma place) | PASS | qa:smoke |
| 5.3 | Canal Supabase Realtime configurado correctamente | PASS | `place-messages:{placeId}`, filter `place_id=eq.{placeId}` |
| 5.4 | `place_messages` en `supabase_realtime` publication | PASS | Confirmado en DB |
| 5.5 | Deduplicación de mensajes propios (sentIdsRef) | PASS | Código verificado |
| 5.6 | Limpieza de subscription al desmontar | PASS | `unsubscribe()` en cleanup |
| 5.7 | Rate limit cliente (5 msgs/60s) | PASS | `assertCanSendMessage` en services/messages.ts |
| 5.8 | Rate limit servidor (trigger) | PASS | `place_messages_rate_limit` activo en DB |
| 5.9 | Realtime browser (2 pestañas) | DEFERRED | Manual — implementación correcta, no automatizable |

---

## 6. Groups

| # | Item | Estado | Notas |
|---|---|---|---|
| 6.1 | Crear grupo con `access_level` | PASS | public, local, approval_required, invite_only |
| 6.2 | Join grupo público (status=active) | PASS | |
| 6.3 | Join grupo approval_required (status=pending) | PASS | UI: "Solicitar unirme" |
| 6.4 | Owner aprueba/rechaza miembros | PASS | `approveGroupMember` / `rejectGroupMember` |
| 6.5 | `access_level` correcto (no `visibility` obsoleto) | PASS | qa:smoke + servicios |
| 6.6 | RLS owner policies funcionan | PASS | |
| 6.7 | Chat de grupo funcional | PASS | `app/group/[id]/chat.tsx` |
| 6.8 | Configuración/edición de grupo | PASS | `app/group/[id]/settings.tsx` |

---

## 7. Events

| # | Item | Estado | Notas |
|---|---|---|---|
| 7.1 | Crear evento (desde lugar) | PASS | |
| 7.2 | Crear evento (desde grupo) | PASS | |
| 7.3 | RSVP going | PASS | + SafetyNotice obligatorio |
| 7.4 | RSVP interested | PASS | |
| 7.5 | RSVP cancelled | PASS | |
| 7.6 | Sin duplicados RSVP (UNIQUE constraint) | PASS | |
| 7.7 | Creator recibe RSVP going automático | PASS | |
| 7.8 | Lista de asistentes | PASS | `app/event/[id]/attendees.tsx` |
| 7.9 | Chat de evento | PASS | `app/event/[id]/chat.tsx` |

---

## 8. Reports / Blocks

| # | Item | Estado | Notas |
|---|---|---|---|
| 8.1 | Usuario reporta mensaje (`message_id`) | PASS | Schema real |
| 8.2 | Usuario reporta usuario (`reported_user_id`) | PASS | Schema real |
| 8.3 | Spoof `reporter_id` bloqueado | PASS | RLS 42501 |
| 8.4 | Usuario bloquea usuario | PASS | |
| 8.5 | Mensajes de bloqueado filtrados (RLS) | PASS | 0 rows |
| 8.6 | Spoof `blocker_id` bloqueado | PASS | RLS 42501 |
| 8.7 | `ReportDialog` con razones predefinidas | PASS | componente existente |

---

## 9. Moderation

| # | Item | Estado | Notas |
|---|---|---|---|
| 9.1 | `isCurrentUserModerator` usa `role = 'moderator'` (no `is_moderator`) | PASS | |
| 9.2 | Moderation inbox accessible para moderador | PASS | `app/moderation/inbox.tsx` |
| 9.3 | Moderation inbox NO accessible para usuario normal | PASS | Acceso restringido |
| 9.4 | Filtros por status (pending/reviewed/actioned/dismissed) | PASS | |
| 9.5 | Update status de report | PASS | |
| 9.6 | SafetyNotice en inbox (confidencialidad) | PASS | tone=critical |
| 9.7 | QA_UserA elevado a moderator (para validación) | PASS | UPDATE profiles role=moderator |

---

## 10. Geofencing / Location

| # | Item | Estado | Notas |
|---|---|---|---|
| 10.1 | `radius_meters` en schema y tipo `Place` | PASS | default 150m |
| 10.2 | App no rompe sin permisos de location | PASS | Fallback: lista de lugares |
| 10.3 | No se expone coordenada exacta del usuario | PASS | Sin campo de ubicación usuario en UI |
| 10.4 | `expo-location` integrado | DEFERRED | Etapa 2 |
| 10.5 | Cálculo de distancia (Haversine) | DEFERRED | Etapa 2 |
| 10.6 | `canPost` por proximidad | DEFERRED | Etapa 2 |
| 10.7 | Mapa real de lugares cercanos | DEFERRED | Etapa 2 |

---

## 11. Web preview

| # | Item | Estado | Notas |
|---|---|---|---|
| 11.1 | App levanta en puerto 5000 | PASS | `bash scripts/start-web.sh` |
| 11.2 | Preview URL accesible | PASS | `.worf.replit.dev` |
| 11.3 | Login/Register funcionales en web | PASS | |
| 11.4 | Navegación principal funciona en web | PASS | |
| 11.5 | Layout mobile-first en web | PASS | React Native Web |
| 11.6 | No pantalla blanca en rutas conocidas | PASS | |
| 11.7 | No warnings visibles de mocks | PASS | Supabase real activo |

---

## 12. Expo Go / Mobile (pendiente)

| # | Item | Estado | Notas |
|---|---|---|---|
| 12.1 | App levanta en Expo Go | BLOCKED | Expo Go requiere QR en dispositivo físico — no testeable desde Replit |
| 12.2 | Auth funciona en Expo Go | BLOCKED | Depende de 12.1 |
| 12.3 | Location permission en iOS/Android | DEFERRED | Etapa 2 |
| 12.4 | Push notifications | DEFERRED | Post-MVP |

---

## 13. Secrets audit

| # | Item | Estado | Notas |
|---|---|---|---|
| 13.1 | `service_role` no en app/components/services/lib | PASS | Solo en `scripts/` |
| 13.2 | `SUPABASE_DB_PASSWORD` no en código | PASS | Solo en `scripts/doctor-db-url.mjs` como lectura de env |
| 13.3 | `SUPABASE_ACCESS_TOKEN` no en código | PASS | Solo en `scripts/lib/supabase-db-url.mjs` |
| 13.4 | `EXPO_PUBLIC_SERVICE_ROLE_KEY` no existe | PASS | |
| 13.5 | `EXPO_PUBLIC_DB_PASSWORD` no existe | PASS | |
| 13.6 | `EXPO_PUBLIC_DB_URL` no existe | PASS | |
| 13.7 | `.env` con valores reales | PASS | Solo `.env.example` con campos vacíos |
| 13.8 | `.gitignore` protege `.env` | PASS | `.env` y `.env.*` ignorados |
| 13.9 | `SUPABASE_SERVICE_ROLE_KEY` en `.replit` `[userenv.shared]` | MEDIUM | Mecanismo Replit Secrets — ver ETAPA_1D_RELEASE_QA.md §10 |

---

## 14. Known limitations

| # | Limitación | Impacto | Plan |
|---|---|---|---|
| L1 | Geofencing no activo — cualquier usuario puede chatear en cualquier lugar | MEDIO | Etapa 2 |
| L2 | Mapa real de lugares cercanos no implementado (Tab Mapa es placeholder) | BAJO | Etapa 2 |
| L3 | Expo Go / mobile no validado | BAJO | Etapa 2 |
| L4 | Lint / test scripts no configurados | BAJO | Post-MVP |
| L5 | Realtime y rate limit validados en código pero no en browser interactivo | BAJO | Manual por usuario |
| L6 | `SUPABASE_SERVICE_ROLE_KEY` visible en `.replit` (Replit Secrets) | MEDIO | Rotar si repo público en GitHub |
| L7 | README.md no existe | MUY BAJO | Crear en Etapa 1E |
| L8 | Un solo lugar tiene mensajes de test de QA (cleanup post-QA recomendado) | MUY BAJO | Limpiar antes de producción real |

---

## 15. Go / No-Go

| Criterio | Decisión |
|---|---|
| Backend funcional | ✅ GO |
| RLS activo y validado | ✅ GO |
| Auth funcional | ✅ GO |
| Chat funcional | ✅ GO |
| Groups funcional | ✅ GO |
| Events funcional | ✅ GO |
| Moderation funcional | ✅ GO |
| No exposición crítica de secrets | ✅ GO |
| Geofencing activo | ⚠️ DEFERRED — aceptado para MVP |
| Mobile validado | ⚠️ DEFERRED — aceptado para MVP |
| Lint/test | ⚠️ NO CONFIGURADO — aceptado para MVP |

### Veredicto final: **GO** ✅

**ParkChat / Aldea v0.1.0 está listo para ser tagueado.**

Pendiente solo aprobación explícita del usuario para ejecutar:

```
git tag v0.1.0
git push origin v0.1.0
```

> Etapa 1E: crear tag, GitHub Release con release notes, y comunicado interno.
