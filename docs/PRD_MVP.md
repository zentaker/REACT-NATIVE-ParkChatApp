# Aldea MVP PRD

> Hoja de ruta del proyecto: ver [ROADMAP.md](./ROADMAP.md).

## Problema

Las redes sociales actuales no organizan bien la vida comunitaria alrededor de lugares fisicos. Un parque, cafe, plaza o coworking puede tener actividad real, pero esa actividad queda fragmentada en grupos privados, mensajes sueltos o eventos aislados.

## Hipotesis

La hipotesis principal del MVP es:

> La gente quiere entrar al espacio digital de un lugar fisico y hablar con desconocidos o locales de forma segura.

El flujo a validar es:

```txt
lugar fisico -> conversacion -> grupo/evento
```

## Usuario Objetivo Inicial

- Personas que frecuentan parques, cafes, plazas, universidades o coworkings.
- Comunidades hiperlocales que ya se reunen en espacios publicos.
- Usuarios que quieren conversaciones locales sin una estetica de dating app ni marketplace.
- Organizadores pequenos que necesitan convertir una conversacion local en grupo o evento.

## Propuesta De Valor

Aldea convierte cada lugar fisico en una comunidad viva con chat publico, grupos locales, eventos espontaneos y reglas de seguridad desde el inicio.

## Flujo Principal

1. Usuario abre la app.
2. Ve espacios cercanos o sugeridos.
3. Entra a un lugar.
4. Lee el chat publico del lugar.
5. Escribe o reacciona.
6. Explora grupos del lugar.
7. Se une a un evento o grupo.
8. La actividad queda asociada al lugar.

## Funciones Del MVP

- Auth basica.
- Mapa o listado de espacios cercanos.
- Perfil de lugar.
- Chat publico por lugar.
- Grupos del lugar.
- Eventos del lugar.
- Perfil basico de usuario.
- Seguridad basica: reportar, bloquear y niveles de acceso.
- Datos mock cuando Supabase no esta configurado.

## No Objetivos De La Primera Version

- Neo4j o grafo social completo.
- IA o moderacion avanzada por IA.
- Matching romantico.
- Feed global.
- Monetizacion.
- Marketplace.
- Ranking publico de usuarios.
- Exponer ubicacion exacta de usuarios.

## Riesgos Principales

- Chats vacios si se lanza en demasiados lugares a la vez.
- Riesgo de acoso o stalking si no se protege la ubicacion.
- Spam en chats publicos.
- Eventos presenciales inseguros.
- Complejidad tecnica si se introduce grafo antes de validar comportamiento.
- Costos de realtime si no se limita el alcance inicial.

## Criterio De Validacion

El MVP avanza si usuarios reales:

- Entran a un lugar digital.
- Leen y escriben en el chat local.
- Vuelven al mismo espacio.
- Crean o se unen a grupos.
- Crean o se unen a eventos nacidos desde el lugar.
- Reportan sentirse seguros usando presencia agregada en vez de ubicacion exacta.
