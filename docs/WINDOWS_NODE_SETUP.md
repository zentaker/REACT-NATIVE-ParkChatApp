# Windows Node/npm Setup

## Diagnostico Rapido

Desde PowerShell, en el repo:

```powershell
cd C:\Users\Are\Desktop\parkchat
npm run doctor:node
```

Si `npm` no resuelve todavia, ejecuta el doctor por ruta:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\doctor-node.ps1
```

Comandos utiles:

```powershell
node -v
npm -v
npx -v
where.exe node
where.exe npm
where.exe npm.cmd
where.exe npx
where.exe npx.cmd
Get-Command node
Get-Command npm
Get-Command npm.cmd
```

## Diagnostico Encontrado En Codex

En este entorno, `C:\Program Files\nodejs\` existe y contiene:

- `node.exe`
- `npm.cmd`
- `npx.cmd`

Pero el `PATH` de Codex apunta a `C:\Program Files (x86)\nodejs\` y no a `C:\Program Files\nodejs\`. Ademas, `node` resuelve primero a un binario empaquetado de Codex/WindowsApps que falla con `Access is denied`.

Workaround verificado:

```powershell
& "C:\Program Files\nodejs\node.exe" -v
& "C:\Program Files\nodejs\npm.cmd" -v
& "C:\Program Files\nodejs\npx.cmd" -v
```

Workaround recomendado para la sesion actual de PowerShell:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm.cmd run doctor:node
npm.cmd install
npm.cmd run typecheck
npm.cmd run start
```

## PATH Esperado

Windows debe incluir estas entradas:

```text
C:\Program Files\nodejs\
%AppData%\npm
```

Si aparece esta entrada y no existe, corrigela:

```text
C:\Program Files (x86)\nodejs\
```

Despues de cambiar PATH, cierra y vuelve a abrir PowerShell, VS Code y Codex para que hereden el entorno nuevo.

## Instalar Node LTS Con Winget

Si `node` no existe y `winget` esta disponible:

```powershell
winget install OpenJS.NodeJS.LTS
```

Luego reinicia PowerShell, VS Code y Codex, y valida:

```powershell
node -v
npm -v
npx -v
```

## Instalador Oficial

Si `winget` no existe:

1. Descarga Node.js LTS desde el sitio oficial de Node.js.
2. Instala con la opcion de agregar Node/npm al PATH.
3. Cierra y vuelve a abrir PowerShell, VS Code y Codex.
4. Valida:

```powershell
node -v
npm -v
npx -v
```

## Workaround Si npm No Resuelve Pero npm.cmd Existe

Usa `npm.cmd` directamente:

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run start
```

Si `npm.cmd` tampoco resuelve por PATH pero existe en `C:\Program Files\nodejs\`:

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run typecheck
& "C:\Program Files\nodejs\npm.cmd" run start
```

## Correr Aldea

Cuando Node/npm esten disponibles:

```powershell
npm install
npm run typecheck
npm run start
```

Con el workaround de ruta absoluta:

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run typecheck
& "C:\Program Files\nodejs\npm.cmd" run start
```

Si `npm run start` falla en Codex con `EPERM` escribiendo en `C:\Users\Are\.expo`, es una restriccion del sandbox al escribir fuera del workspace. En una terminal normal de Windows suele resolverse al corregir PATH y reiniciar la terminal. En Codex puede requerir aprobar la ejecucion fuera del sandbox.
