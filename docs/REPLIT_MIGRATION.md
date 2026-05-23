# Aldea Replit Migration

## Objetivo

Preparar Aldea para desarrollo en Replit sin convertirla en web-only:

- Expo Go sigue siendo la validacion mobile real.
- Expo Web queda como preview rapido en Replit.
- GitHub queda como fuente de verdad.
- Supabase sigue usando solo URL publica y anon key en cliente.

## Fuentes Consultadas

- Replit documenta `.replit` como el archivo que define el comando `run`, modulos y puertos.
- Replit documenta mobile apps con Expo Go, simulador/emulador en Project Editor y QR para Expo Go.
- Replit recomienda revisar comandos, dependencias, puertos y Secrets cuando un preview no arranca.

## Archivos Agregados

- `.replit`
- `replit.nix`
- `scripts/start-replit-expo.js`
- `scripts/doctor-replit.js`

## Scripts

```bash
npm run replit:start
npm run replit:web
npm run replit:mobile
npm run replit:lan
npm run doctor:replit
```

Uso esperado:

- `replit:start`: Run button en Replit. Arranca Expo Web para preview rapido.
- `replit:web`: alias explicito para web preview.
- `replit:mobile`: arranca Expo con tunnel para Expo Go si el panel de Replit lo necesita.
- `replit:lan`: arranca Expo en modo LAN.
- `doctor:replit`: valida configuracion basica sin imprimir secretos.

## Importar A Replit

1. Sube el repo a GitHub.
2. Importa el repo en Replit desde GitHub.
3. Verifica que Replit detecte Node.
4. Ejecuta:

```bash
npm install
npm run doctor:replit
npm run replit:start
```

## Secrets En Replit

Configura estas variables en Replit Secrets, no en archivos:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

No agregues:

```bash
SUPABASE_SERVICE_ROLE_KEY
```

La service role key nunca debe estar disponible para el cliente Expo.

## Preview Web

El Run button usa:

```bash
npm run replit:start
```

Esto ejecuta:

```bash
npx expo start --web
```

El puerto esperado para Expo/Metro es `8081`, configurado en `.replit`.

## Preview Mobile Con Expo Go

Replit soporta mobile preview con Expo Go desde el Project Editor. Si necesitas forzar tunnel:

```bash
npm run replit:mobile
```

Luego escanea el QR desde Expo Go. Este flujo mantiene validacion native real y evita convertir Aldea a web-only.

## Flujo Local

Windows local sigue usando:

```bash
npm run doctor:node
npm run start
npm run typecheck
```

No se eliminaron los scripts Windows.

## GitHub Como Fuente De Verdad

Recomendacion de flujo:

```bash
git checkout main
git pull
git checkout -b replit/migration
```

Trabaja en Replit, valida, y abre PR hacia `main`. Evita cambios directos no revisados si tambien trabajas localmente.

## Limitaciones

- Expo Web es preview rapido, no reemplaza Expo Go.
- Algunas APIs nativas deben probarse en Expo Go o simulador/emulador.
- Supabase real requiere Secrets configurados.
- Si faltan Secrets, Aldea cae a mocks por diseno.
