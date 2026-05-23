# GitHub / Replit Sync

## 1. GitHub como fuente de verdad

El repositorio oficial del proyecto vive en GitHub:

```
origin  https://github.com/zentaker/REACT-NATIVE-ParkChatApp
```

Todo cambio relevante debe terminar reflejado allí. Replit se usa como workspace cloud del agente y como entorno de validación rápida; nunca como fuente de verdad.

## 2. Replit como workspace del agente

- Permite editar código, correr `npm install`, ejecutar diagnósticos y levantar Expo en modo web.
- Las claves nunca se commitean: viven en **Replit Secrets** (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- El archivo `.env` está ignorado por `.gitignore`. Solo `.env.example` viaja al repo.

## 3. Validar el remote

```bash
git remote -v
git branch
git status
git log --oneline -10
```

Esperado:
- `origin` apunta a `github.com/zentaker/REACT-NATIVE-ParkChatApp`.
- Rama principal: `main`.

Si falta identidad local del agente, configurarla **solo** para este repo:

```bash
git config user.name  "Replit Agent"
git config user.email "replit-agent@example.com"
```

## 4. Commit desde Replit

```bash
git status --short
git add .
git commit -m "feat: <descripción corta>"
```

Antes del commit, asegurarse de que `git status` no liste archivos sensibles ni binarios pesados:
- `.env`
- `node_modules/`
- `dist/`, `web-build/`, `.expo/`

## 5. Push a GitHub

```bash
git push origin main
```

Si el push falla por autenticación, no inventar tokens. Avisar al usuario y dejar que reconecte el remote desde el panel de Git de Replit.

## 6. Crear release por tag

```bash
git tag v0.1.0
git push origin v0.1.0
```

Esto dispara `.github/workflows/release.yml`, que:
1. Hace checkout del repo.
2. Genera `dist/parkchat_source_bundle.zip` excluyendo `node_modules`, `.expo`, `.env*`, `android/`, `ios/`, etc.
3. Crea un release de GitHub con notas autogeneradas.

No crear tags sin que el usuario lo pida explícitamente.

## 7. Qué **no** versionar

- `node_modules/`
- `.expo/`
- `dist/`, `web-build/`
- `android/`, `ios/` (builds nativos)
- `.env`, `.env.local`, `.env.production`
- Logs (`npm-debug.log*`, `yarn-*.log`)
- `.DS_Store`

## 8. Conflictos

1. `git fetch origin`
2. `git pull --rebase origin main`
3. Resolver manualmente los archivos en conflicto.
4. `git add <archivos>`
5. `git rebase --continue`
6. `git push origin main`

Si el conflicto involucra `package-lock.json`, reconstruir con `npm install` después de aceptar la versión de `main`.

## 9. Push falla

- **Credenciales**: el usuario debe reconectar GitHub desde el panel Replit (Tools → Git).
- **Branch protection**: abrir PR desde una rama (`git checkout -b feat/x && git push origin feat/x`).
- **Histórico divergente**: nunca hacer `git push --force` automáticamente; documentar y consultar.

## 10. Release falla

- Revisar el log del workflow en GitHub Actions.
- Verificar que el tag siga el patrón `v*` (ej. `v0.1.0`).
- Si falta `gh` o el token, GitHub Actions provee `${{ github.token }}` automáticamente — no requiere configuración extra.
- Si el zip falla, revisar permisos o tamaño; ajustar exclusiones en `.github/workflows/release.yml`.
