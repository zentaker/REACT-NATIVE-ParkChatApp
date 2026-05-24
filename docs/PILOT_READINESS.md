# Pilot Readiness — Aldea / ParkChat

## Objetivo del piloto

Validar que Aldea funciona como app social local usable con usuarios reales, no solo como
demostración técnica. El piloto mide si la propuesta de valor — "entrar al espacio digital
de un lugar físico" — tiene sentido para el usuario final.

---

## Usuarios objetivo

**Perfil ideal para el piloto:**
- 10–30 personas
- Visitan regularmente el mismo lugar físico (café, parque, plaza, coworking)
- Usan apps sociales (WhatsApp, Instagram) pero sienten que les falta comunidad local
- Cómodos con apps en beta (tolerantes a bugs no críticos)
- Disposición a dar feedback activo

**No ideal para el piloto:**
- Usuarios que esperan una app pulida y sin bugs
- Lugares sin comunidad previa (frío total)
- Personas que no visitan lugares físicos regularmente

---

## Flujo de prueba

1. **Registro** → crear cuenta con nombre + email
2. **Explorar mapa** → ver lugares cercanos, entender la interfaz
3. **Abrir un lugar** → ver perfil social del lugar (grupos, eventos, temas)
4. **Chat de lugar** → leer mensajes existentes, enviar el primero
5. **Unirse a un grupo** → explorar grupos del lugar, solicitar unirse
6. **RSVP a un evento** → explorar eventos, confirmar asistencia
7. **Ver avisos** → recibir notificación de aprobación de grupo o RSVP
8. **Agregar un interés** → ir a perfil, agregar hashtag de interés

---

## Lugares piloto sugeridos

Criterios:
- Lugar físico real con visitas recurrentes
- Al menos 5–10 personas del mismo lugar como beta testers
- Acceso wifi o datos

Ejemplos sugeridos:
- Café de barrio con clientela habitual
- Coworking o espacio de trabajo compartido
- Plaza pública con actividades regulares
- Campus universitario (área específica)
- Mercado local o feria con puestos fijos

---

## Métricas a observar

### Activación
- Usuarios registrados
- Usuarios que completan el flujo hasta el chat
- Usuarios que envían al menos 1 mensaje

### Retención
- Usuarios que vuelven al mismo lugar en 2+ días distintos
- Usuarios que revisitan el tab de Avisos

### Social
- Grupos creados
- Usuarios que se unen a un grupo
- Eventos creados
- RSVPs registrados (going/maybe)
- Temas activos generados (hashtags en chat)

### Calidad
- Reportes enviados
- Bloqueos realizados
- Mensajes eliminados por moderación

### Técnico
- Errores de carga (pantallas blancas)
- Latencia percibida en envío de mensajes
- Problemas de geofence (falsos negativos/positivos)

---

## Bugs a buscar activamente

### Críticos (bloquean piloto)
- Login / registro falla silenciosamente
- Chat no muestra mensajes enviados
- App se cuelga en tab de Mapa sin ubicación
- Notificaciones no llegan (in-app)
- RSVP no se registra en DB

### Moderados (no bloquean pero afectan experiencia)
- Geofence muy restrictivo en modo strict (posición GPS inestable)
- EmptyState aparece pero debería mostrar contenido
- Distancia aparece como "0 m" o incorrecta
- Loading infinito si falla query

### Menores
- Tiempo relativo en avisos ("hace 0m" en vez de "ahora")
- Acentos faltantes en labels
- Truncado de nombre en tarjeta

---

## Qué feedback pedir

### Al usuario
1. ¿Entendiste para qué sirve la app al verla por primera vez?
2. ¿Qué fue lo primero que quisiste hacer?
3. ¿Encontraste el lugar que esperabas?
4. ¿Te sentiste cómodo enviando un mensaje?
5. ¿La notificación de grupo/evento llegó cuando esperabas?
6. ¿Volverías a usar la app en ese lugar?
7. ¿Qué te faltó o qué te sobró?

### Al observar (sin preguntar)
- ¿Dónde se trabaron?
- ¿Qué presionaron que no los llevó a donde querían?
- ¿Qué leyeron con cara de confusión?
- ¿Abrieron Avisos sin que se los dijeras?

---

## Qué NO prometer todavía

- Push notifications al dispositivo (solo in-app)
- Notificaciones en background
- Matching de usuarios por intereses
- Feed global de actividad
- Mapa en tiempo real (usuarios en vivo)
- Grupos sin aprobación manual si el owner no está activo
- Historial de chat infinito
- Soporte offline
- Dark mode
- Edición de perfil completa

---

## Checklist antes de invitar usuarios

### Base técnica
- [ ] Supabase operativo (no en mantenimiento)
- [ ] RLS activado en todas las tablas
- [ ] Sin errores en typecheck
- [ ] qa:smoke 23/23 PASS
- [ ] qa:notifications 12/12 PASS
- [ ] qa:geo 12/12 PASS
- [ ] qa:geofence 15/15 PASS

### Datos
- [ ] Al menos 1 lugar real en la DB con coordenadas correctas
- [ ] Radio del lugar configurado correctamente
- [ ] EXPO_PUBLIC_STRICT_GEOFENCE_POSTING=false para piloto inicial

### UX
- [ ] Login/registro funcionan en dispositivo real
- [ ] Chat de lugar muestra mensajes en tiempo real
- [ ] Tab de Avisos funciona
- [ ] Empty states muestran mensajes amigables (sin referencias técnicas)
- [ ] PlaceCard muestra nombre, tipo, ciudad correctamente

### Seguridad
- [ ] Secrets no impresos en consola
- [ ] RLS impide ver contenido de otros usuarios sin permiso
- [ ] Geofence funciona en modo flexible para piloto

### Comunicación
- [ ] Usuarios informados que es una beta
- [ ] Canal de feedback definido (WhatsApp, formulario, etc.)
- [ ] Datos de contacto del admin disponibles

---

## Checklist después de la prueba

### Datos
- [ ] Revisar messages por lugar (¿cuántos mensajes se enviaron?)
- [ ] Revisar groups creados
- [ ] Revisar events creados
- [ ] Revisar RSVPs
- [ ] Revisar place_topics generados (hashtags)
- [ ] Revisar reports/blocks (señal de problemas)
- [ ] Revisar in_app_notifications entregadas

### Retroalimentación
- [ ] Entrevistas individuales o grupo focal (30 min)
- [ ] Recopilar respuestas al formulario de feedback
- [ ] Identificar los 3 problemas más comunes
- [ ] Identificar la funcionalidad más usada

### Decisiones post-piloto
- [ ] ¿Vale la pena continuar con Stage 3?
- [ ] ¿Qué flujo necesita rediseño urgente?
- [ ] ¿Qué funcionalidad no usó nadie?
- [ ] ¿Qué pidieron que no existe?

---

## Próximo stage después del piloto

**Si el piloto es exitoso (usuarios regresan, envían mensajes, crean grupos):**
→ Stage 2F — Pilot analytics, grupos mejorados, loops de retención

**Si el piloto muestra confusión en onboarding:**
→ Stage 2E-v2 — Onboarding guiado paso a paso, tutorial interactivo

**Si el piloto muestra latencia o bugs en chat:**
→ Stage 2E-Fix — Chat performance, Realtime reconnection, error states
