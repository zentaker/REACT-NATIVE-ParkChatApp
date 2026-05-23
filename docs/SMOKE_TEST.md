# Smoke Test — Aldea / ParkChat

Actualizado: 23-may-2026 (Etapa 1D)

> Pasos reproducibles para validar el cierre de Etapa 1A/1D: auth real, perfil creado, lectura/escritura de mensajes, grupos, eventos, reportes, bloqueos y RLS.

---

## Ejecución automatizada

```bash
npm run qa:seed    # Crea/verifica usuarios QA + seed
npm run qa:smoke   # 23/23 PASS
```

### Resultado actual

```
PASS: 23
FAIL: 0
[OK]  All smoke tests passed. RLS working correctly.
```

---

## Usuarios QA

| Usuario | ID (prefijo) | Role |
|---|---|---|
| `qa.aldea.a@example.com` | `ef1489ce...` | moderator |
| `qa.aldea.b@example.com` | `074afbbd...` | user |

Password: `Ald3aQA!2026`

---

## Cobertura del smoke test automatizado

| # | Check | Resultado |
|---|---|---|
| 1 | Login User A | PASS |
| 2 | Login User B | PASS |
| 3 | User A reads places (4 rows) | PASS |
| 4 | User A reads own profile | PASS |
| 5 | User A inserts place_message | PASS |
| 6 | User B sees message from A | PASS |
| 7 | User B inserts reply | PASS |
| 8 | User A sees reply from B | PASS |
| 9 | RLS: A spoofing B user_id en place_messages | PASS (42501) |
| 10 | RLS: A edita mensaje de B (0 rows) | PASS |
| 11 | RLS: A edita profile de B (0 rows) | PASS |
| 12 | A lee profile de B (permitido) | PASS |
| 13 | A crea report (message_id, status=open) | PASS |
| 14 | RLS: A spoofing B reporter_id | PASS (42501) |
| 15 | A bloquea a B | PASS |
| 16 | RLS post-block: mensajes de B filtrados para A (0 rows) | PASS |
| 17 | RLS: A spoofing B blocker_id | PASS (42501) |
| 18 | A crea grupo (access_level=public) | PASS |
| 19 | B lee grupos públicos | PASS |
| 20 | RLS: A spoofing B created_by en groups | PASS (42501) |
| 21 | A crea evento | PASS |
| 22 | B hace RSVP going | PASS |
| 23 | RLS: B spoofing A user_id en event_rsvps | PASS (42501) |

---

## Smoke test manual — Realtime browser

Requiere WebSocket persistente — no automatizable desde Node.js en Replit.

**Pasos:**

1. Abrir la app (pestaña A) → Login QA_UserA.
2. Navegar a Parque Kennedy → Chat del lugar.
3. Abrir pestaña B (incognito) → Login QA_UserB.
4. Navegar al mismo lugar → Chat.
5. QA_UserA envía mensaje → debe aparecer en pestaña B sin refresh (< 1s).
6. QA_UserB responde → debe aparecer en pestaña A sin refresh.
7. Verificar: sin duplicados, orden cronológico correcto.

**Canal Supabase Realtime**: `place-messages:{placeId}`, filter `place_id=eq.{placeId}`, event `INSERT`.

---

## Smoke test manual — Rate limit

1. Login como QA_UserA en browser.
2. Ir a chat de cualquier lugar.
3. Enviar 5 mensajes en secuencia rápida.
4. El 6to debe mostrar timer de cooldown en `MessageInput`.
5. Enviar el mismo mensaje dos veces → el segundo es rechazado (duplicate_message).

**Umbral**: 5 mensajes / 60 segundos. Doble capa: cliente + trigger servidor.

---

## Prerrequisitos para re-run

```bash
npm run supabase:apply:all   # Asegurar triggers, policies y seed actualizados
npm run qa:seed              # Crear/verificar usuarios QA
npm run qa:smoke             # Ejecutar 23 checks automatizados
```
