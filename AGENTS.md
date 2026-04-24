# ReleaseHub - Architecture and Development Guide

## POLÍTICA ESTRICTA DE ITERACIÓN

⚠️ **CRÍTICO**: Antes de cualquier cambio al sistema, DEBO seguir este proceso:

1. **Evaluar los docs relacionados**: Revisar todos los documentos en `docs/` que puedan afectarse por el cambio
2. **Evaluar el codebase**: Verificar que los docs están actualizados. Si no lo están, sugerir vehementemente actualizarlos antes de continuar
3. **Evaluar críticamente la propuesta**: Debe ser claro el beneficio o estar muy bien explicado por qué NO causa regresión. La idea es que el sistema EVOLUCIONE, no INVOLUCIONE
4. **Interrogar hasta alineación**: No asumir nada. Debo interrogar hasta estar 100% seguro de que estamos alineados en cada detalle y principalmente en el objetivo
5. **Solo una vez alineados**: Actualizar los docs involucrados o crear nuevos docs, luego implementar
6. **LOS DOCS SON LA FUENTE DE LA VERDAD**: Si hay conflicto entre docs y código, los docs tienen prioridad

## Documentación del Sistema

La documentación está organizada en tres categorías:

- **docs/adr/**: Architecture Decision Records para decisiones técnicas
- **docs/design/**: Decisiones de diseño y UX para componentes
- **docs/decisions/**: Decisiones estratégicas del sistema

Antes de cualquier cambio, revisar los docs relevantes para evaluar impacto y evitar regresiones.

## Stack Tecnológico

- **Framework**: React + Vite
- **Routing**: TanStack Router (file-based routing)
- **Data Fetching**: TanStack Query v5
- **UI Components**: shadcn/ui + TailwindCSS
- **Iconos**: Lucide React
- **APIs**:
  - CI/CD API: pipelines and deployment events
  - GitHub API: via GitHub CLI (`gh api`)
- **CLI Tools**:
  - GitHub CLI (`gh`): operaciones remotas en repositorios
  - Git: NO se usa para operaciones locales

## REGLAS CRÍTICAS DE DESARROLLO

### 1. Operaciones por Repositorio

⚠️ **IMPORTANT**: ReleaseHub works with multiple repositories simultaneously. Todas las operaciones deben cumplir estas reglas:

1. **Operaciones remotas únicamente**: TODAS las operaciones (crear tags, obtener commits, etc.) deben hacerse vía API de GitHub o GitHub CLI (`gh`). NUNCA usar comandos `git` locales que requieran estar en el directorio del repo.

2. **Especificar repo explícitamente**: Cada comando debe especificar explícitamente en qué repo se opera. Usar el formato `org/repo` en todos los comandos.

3. **No mezclar repos**: Nunca asumir que estamos en un directorio local específico. Cada operación debe ser aislada al repo actual.

### 2. Validación Antes de Implementar

⚠️ **MUY IMPORTANTE**: Antes de implementar o modificar cualquier función que use comandos externos (gh api, curl, git, etc.), SIEMPRE:

1. **Validar el comando en terminal**: Ejecutar el comando exacto en la terminal para verificar que funciona.
2. **Analizar la respuesta**: Revisar el formato de salida (JSON, texto, errores) para entender exactamente qué devuelve.
3. **Implementar con conocimiento exacto**: Solo después de validar y analizar la respuesta, implementar la función basándose en el formato real.
4. **EXCEPCIÓN - Operaciones de escritura**: Si la operación modifica un repo (crear tags, commits, etc.), CONSULTAR AL USUARIO antes de ejecutarla en producción.

### 3. Tokens de Autenticación

⚠️ **CRÍTICO**: Usar el token correcto para cada API:

- **GitHub API**: Usar token de GitHub CLI (`gh auth token`)
  - Obtener dinámicamente: `gh auth token`
  - NUNCA usar token de Seki para GitHub
  - NUNCA usar tokens hardcodeados

- **Seki API**: Usar token JWT de Seki
  - Almacenado en localStorage como `seki_api_token`
  - Configurado vía UI por el usuario
  - NUNCA usar token de gh para Seki

### 4. Gestión de Permisos

Para verificar si un usuario puede crear tags, usar el objeto permissions de GitHub API (permissions.push, permissions.maintain, permissions.admin). Fallback a viewerPermission (legacy).

### 5. Gestión de Estado React Query

Después de operaciones de escritura (crear tag, etc.), invalidar queries relevantes y mantener estado local. No usar window.location.reload().

## Local Requirements

1. **Node.js** (v18+)
2. **Git** installed
3. **GitHub CLI** (`gh`) installed and authenticated
4. **Access** to your GitHub repositories

## Comandos Útiles

### Desarrollo
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Previsualizar build de producción
```

### GitHub CLI
```bash
gh auth status       # Verificar autenticación
gh auth token        # Obtener token actual
gh repo list <org>   # Listar repos de una org
gh api <endpoint>    # Hacer llamada a API de GitHub
```

## Referencias

- Documentación de decisiones: docs/
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [GitHub CLI Docs](https://cli.github.com/manual/)
- [GitHub API Docs](https://docs.github.com/en/rest)
- [shadcn/ui](https://ui.shadcn.com/)
