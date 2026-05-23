# Config Debug — EXPO_PUBLIC_SUPABASE_URL

Fecha: 23-may-2026 | Proyecto: Aldea / ParkChat

## 1. Problema observado

`npm run doctor:node` reporta que `EXPO_PUBLIC_SUPABASE_URL` contiene un JWT
(longitud 208, empieza con `eyJhbGci`) en vez de la URL del proyecto Supabase.

La app cae a mocks y no puede conectarse al backend real.

## 2. Variables esperadas

| Variable | Valor esperado |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://apcdhwqfntujcwsbtfbu.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | JWT anon/public key (empieza con `eyJhbGci`) |

## 3. Qué se encontró

Diagnóstico con `node scripts/doctor-env.mjs`:

```
EXPO_PUBLIC_SUPABASE_URL:
  exists        : true
  length        : 208
  starts with   : "eyJhbGci"
  looksLikeUrl  : false
  looksLikeJwt  : true

EXPO_PUBLIC_SUPABASE_ANON_KEY:
  exists        : true
  length        : 208
  starts with   : "eyJhbGci"
  looksLikeUrl  : false
  looksLikeJwt  : true

equalityCheck (URL == ANON_KEY) : true
```

**Conclusión:** ambas variables tienen exactamente el mismo valor (el mismo JWT).
El usuario pegó el anon key dos veces — una en cada campo del panel de Secrets.

## 4. Fuentes revisadas

| Fuente | Resultado |
|---|---|
| Replit Secrets (panel UI) | No accesible desde código, pero confirmado como fuente única |
| `.env` / `.env.local` | No existen (solo `.env.example`) |
| Valores hardcodeados en source | No encontrados |
| `lib/supabase.ts` | Solo lee `process.env`, sin override |
| `scripts/doctor-node.mjs` | Solo lee `process.env`, sin override |
| `app.json` | Sin valores de env hardcodeados |
| `scripts/start-web.sh` | No setea variables de env |

## 5. Causa raíz

Error de UI en el panel de Replit Secrets: el usuario copió el JWT del campo
`EXPO_PUBLIC_SUPABASE_ANON_KEY` y lo pegó también en `EXPO_PUBLIC_SUPABASE_URL`.

La URL del proyecto Supabase (`https://apcdhwqfntujcwsbtfbu.supabase.co`)
**nunca fue guardada correctamente** en el secret `EXPO_PUBLIC_SUPABASE_URL`.

## 6. Solución implementada — Variable de fallback

Se añadió soporte para `EXPO_PUBLIC_SUPABASE_PROJECT_URL` en `lib/supabase.ts`.

Lógica de prioridad:
1. Si `EXPO_PUBLIC_SUPABASE_URL` es una URL válida (no JWT) → usarla.
2. Si `EXPO_PUBLIC_SUPABASE_URL` parece JWT y `EXPO_PUBLIC_SUPABASE_PROJECT_URL`
   es válida → usar la alternativa con warning en consola.
3. Si ninguna es válida → fallback a mocks (comportamiento anterior).

Esto permite desbloquear la conexión a Supabase añadiendo **un secret nuevo**
sin tener que editar el secret dañado.

## 7. Acción requerida por el usuario

En **Replit → Tools → Secrets**, crear un secret nuevo:

```
Nombre : EXPO_PUBLIC_SUPABASE_PROJECT_URL
Valor  : https://apcdhwqfntujcwsbtfbu.supabase.co
```

No editar el secret dañado `EXPO_PUBLIC_SUPABASE_URL` (ya que el usuario no
ha podido pegarlo correctamente en múltiples intentos).

Después de guardar el secret nuevo, reiniciar el workflow en Replit.

## 8. Comandos para validar

```bash
# Verificar que el nuevo secret llega al proceso
node scripts/doctor-env.mjs

# Resultado esperado:
# EXPO_PUBLIC_SUPABASE_PROJECT_URL:
#   looksLikeUrl: true
#   looksLikeJwt: false
# [OK] EXPO_PUBLIC_SUPABASE_PROJECT_URL is a valid URL — fallback will be used.

# Verificar estado general
npm run doctor:node

# Typecheck
npm run typecheck

# Arrancar con cache limpio
npm run start:web:clear
```

## 9. Próximo paso

### Si el usuario añade `EXPO_PUBLIC_SUPABASE_PROJECT_URL`:
→ La app usará el fallback automáticamente.
→ El warning en consola será: `[supabase] EXPO_PUBLIC_SUPABASE_URL looks invalid; using EXPO_PUBLIC_SUPABASE_PROJECT_URL fallback.`
→ La app se conectará a Supabase real.
→ Continuar con **Etapa 1A-QA Real**.

### Si el problema persiste:
→ Revisar si Replit está cacheando el valor del secret.
→ Intentar eliminar el secret `EXPO_PUBLIC_SUPABASE_URL` y recrearlo desde cero.
→ Contactar soporte de Replit si el panel de Secrets no aplica cambios.

## 10. Archivos modificados

| Archivo | Cambio |
|---|---|
| `lib/supabase.ts` | Lógica de fallback para `EXPO_PUBLIC_SUPABASE_PROJECT_URL` |
| `scripts/doctor-node.mjs` | Detección de fallback, equalityCheck, recomendaciones |
| `scripts/doctor-env.mjs` | Nuevo script de diagnóstico seguro de env vars |
| `docs/CONFIG_DEBUG_SUPABASE_ENV.md` | Este archivo |
