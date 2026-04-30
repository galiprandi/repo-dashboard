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

### 2. Features No Disponibles

⚠️ **POLÍTICA DE VISIBILIDAD**: Para features que pueden no estar disponibles para todos los usuarios (ej: acceso a Kubernetes, resúmenes AI, etc.), seguir estas reglas:

1. **No mostrar placeholders durante verificación**: Mientras se verifica si el usuario tiene acceso a una feature, NO mostrar ningún placeholder o mensaje de carga. Renderizar `null` o nada.
2. **Solo mostrar si está disponible**: Solo mostrar la UI de la feature si se confirma que el usuario tiene acceso/disponibilidad.
3. **Ocultar completamente si no disponible**: Si el usuario no tiene acceso a la feature, no mostrar nada relacionado con ella (ni botones, ni opciones, ni mensajes de error).
4. **Aplicar a todas las features condicionales**: Esta política aplica a cualquier feature que dependa de:
   - Permisos del usuario (ej: acceso a clusters K8s)
   - Disponibilidad de servicios externos (ej: API de AI)
   - Configuración del sistema (ej: tokens de autenticación)
   - Capacidades del entorno (ej: herramientas CLI instaladas)

**Ejemplos**:
- K8sSection: No mostrar "Verificando acceso a Kubernetes..." mientras verifica. Solo mostrar la card si `access?.hasAccess` es true.
- CommitsModal: Solo mostrar botón de resumen AI si `availability === "available"`.
- LogsModal: Solo mostrar botón de resumen AI si `availability === "available"`.

### 3. Validación Antes de Implementar

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

## Discoveries

### Seki API URL Format Issue

**Problem**: `fetchPipelineWithTag` and `fetchPipeline` were using incorrect URL format for Seki API endpoints.

**Root Cause**: The functions were passing `product` as `org/repo` (e.g., `Cencosud-xlabs/yumi-ticket-control`) directly to the API endpoint, but the Seki API expects separate `organization` and `name` parameters.

**Details**:
- According to `docs/api-reference.md`, the correct endpoint format is `/products/:organization/:name/pipelines/:commit/:tag?`
- The functions were using `/products/${product}/pipelines/${commit}/${tag}` which resulted in invalid URLs
- This caused the API to return empty responses for production pipelines (with tags)

**Solution**: Split the `product` parameter into `org` and `name` using `product.split('/')` and use them separately in the URL construction.

**File Modified**: `src/api/seki.ts` (lines 94-98, 105-113)

**Note**: After fixing the URL format, the API still returns empty data for some tags (e.g., `v1.5.9`). This is expected behavior when the Seki backend doesn't have pipeline data for a specific tag. The frontend correctly handles this by showing "No se detectó un pipeline compatible".

### Debugging Techniques

**Playwright MCP**: Use for automated browser testing and inspection.
- Navigate to URLs: `mcp5_browser_navigate`
- Take snapshots: `mcp5_browser_snapshot`
- Click elements: `mcp5_browser_click`
- View console logs: `mcp5_browser_console_messages`
- Close browser: `mcp5_browser_close`

**curl**: Use for testing API endpoints directly.
- Test endpoints with authentication: `curl -H "Authorization: bearer <token>" <url>`
- Useful for verifying API responses independently of the frontend
- Note: Tokens from localStorage may expire, use fresh tokens for testing
