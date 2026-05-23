# Replit Current Status

## 1. Fecha de validación
2026-05-23

## 2. Repo GitHub conectado
`https://github.com/zentaker/REACT-NATIVE-ParkChatApp`

## 3. Rama activa
`main`

## 4. Últimos commits (resumen)
- `b4f9568` Add detailed project setup and initial development tasks for a geospatial social app
- `e46e077` Update project dependencies to the latest versions
- `d950204` first commit

## 5. `node -v`
`v20.20.0` (módulo Replit `nodejs-20`)

## 6. `npm -v`
`10.8.2`

## 7. `npm install`
OK. 737+ paquetes instalados. Versiones alineadas con Expo 53:
- `expo` ~53.0.0
- `expo-router` ~5.1.11
- `react-native` 0.79.6
- `react-native-screens` ~4.11.1
- `expo-asset` ~11.1.7
- `@react-native-async-storage/async-storage` 2.1.2

## 8. `doctor:node` (`node scripts/doctor-node.mjs`)
- `package.json`, `app.json`, `app/`, `node_modules/`: presentes.
- `EXPO_PUBLIC_SUPABASE_URL`: ver sección 13.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: ver sección 13.
- `SUPABASE_SERVICE_ROLE_KEY`: no debe estar presente en el cliente Expo.

## 9. `typecheck` (`npx tsc --noEmit`)
OK. Cero errores.

## 10. `start:web` (`npx expo start --web --port 5000`)
Corriendo. Metro bundler levanta correctamente y Expo Web sirve en el puerto 5000 (mapeado al preview de Replit).

## 11. `start:go` (Expo Go con tunnel)
**No validado en esta sesión.** Replit no mantiene fácilmente procesos interactivos largos con `--tunnel`; la validación real debe hacerse en máquina local o en un Repl dedicado. La generación del QR queda pendiente hasta que el usuario lo solicite.

## 12. Variables Supabase esperadas
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Se leen vía `process.env.*` en `lib/supabase.ts`. Si están vacías, la app cae automáticamente a mocks (`isSupabaseConfigured === false`).

**Prohibido** usar `SUPABASE_SERVICE_ROLE_KEY` en cliente.

## 13. Variables Supabase detectadas
Solicitadas al usuario vía `requestEnvVar` en esta sesión. El estado real depende de lo que el usuario haya guardado en Replit Secrets; verificar con:

```bash
node scripts/doctor-node.mjs
```

Sin imprimir valores.

## 14. Qué funciona en Replit
- Workspace cloud para edición y commits.
- `npm install`, `typecheck`, diagnósticos.
- Expo Web en preview (puerto 5000).
- Servicios con fallback a mocks si Supabase no está configurado.
- SQL schema y RLS listos en `supabase/schema.sql` y `supabase/policies.sql` para ejecutar en Supabase.

## 15. Qué no está validado todavía
- Expo Go por tunnel (requiere teléfono físico).
- GPS / permisos nativos de ubicación.
- Auth real end-to-end (depende de secretos Supabase cargados).
- Realtime con `place_messages` (depende de schema aplicado en Supabase).
- Push a GitHub desde Replit (depende de credenciales en el panel Git de Replit).

## 16. Próximo paso recomendado
1. Cargar `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en Replit Secrets.
2. Ejecutar `supabase/schema.sql` y `supabase/policies.sql` en el proyecto Supabase.
3. Re-validar con `node scripts/doctor-node.mjs` y reiniciar el workflow.
4. Probar registro + login + envío de mensaje a un place desde el preview.

## Resumen de capa Replit

| Capa                  | Estado                                  |
|-----------------------|-----------------------------------------|
| Workspace cloud       | Validado                                |
| Preview web (Expo)    | Validado                                |
| Expo Go tunnel        | No validado                             |
| Backend Supabase real | Pendiente de secretos + schema aplicado |
