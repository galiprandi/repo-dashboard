# Estrategia de Lanzamiento - Desarrollo Basado en Troncal con Etiquetas

## Estado
Aceptado

## Contexto
ReleaseHub es una aplicación para visualizar y gestionar pipelines de CI/CD y repositorios GitHub. La arquitectura combina una API de CI/CD con operaciones remotas vía CLI de GitHub, evitando operaciones git locales.

El sistema necesita soportar una estrategia de lanzamiento que:
- Permita integración continua rápida
- Haga explícita la promoción a producción
- Sea escalable para múltiples microservicios
- Mantenga trazabilidad de lanzamientos

## Decisión
Implementar estrategia de Desarrollo Basado en Troncal con flujo de promoción basado en Etiquetas.

### Flujo de Trabajo

1. Staging (Integración Continua)
   - Cualquier commit fusionado a la rama principal (main) se despliega automáticamente en Staging
   - Permite validación rápida y constante de nuevas funcionalidades
   - Sin intervención manual para despliegues de staging

2. Producción (Entrega Continua)
   - El despliegue a Producción NO es automático tras el commit
   - Requiere la creación explícita de una Etiqueta de GitHub
   - La etiqueta actúa como una promoción explícita de una versión validada en Staging hacia Producción
   - Solo versiones probadas en Staging pueden ser promovidas

### Por qué esta Estrategia

Visibilidad Unificada
- Centraliza el estado de múltiples microservicios/repositorios
- Permite ver qué commit está en Staging vs qué Etiqueta está en Producción
- Un tablero para monitorear todos los servicios

CLI de GitHub como Motor
- La app utiliza gh para interactuar con la API de GitHub de forma remota
- Permite que la aplicación sea sin estado respecto al sistema de archivos local
- No necesita clonar repositorios ni gestionar estados de git localmente
- Facilita el monitoreo de cientos de repositorios de forma instantánea

Integración con API de Seki
- Conecta con los eventos de despliegue reales
- Proporciona una línea de tiempo visual del progreso de cada lanzamiento
- Integración nativa con el pipeline de CI/CD
- NO está disponible para todos los repositorios
- Se considera un plugin que da visibilidad del estado del pipeline
- Planeamos agregar otros plugins como Pulsar o GitHub Actions en el futuro

## Reglas Críticas

### Operaciones por Repositorio

ReleaseHub funciona con múltiples repositorios simultáneamente. Todas las operaciones deben cumplir estas reglas:

1. Operaciones remotas únicamente: TODAS las operaciones (crear etiquetas, obtener commits, etc.) deben hacerse vía API de GitHub o CLI de GitHub (gh). NUNCA usar comandos git locales que requieran estar en el directorio del repositorio.

2. Especificar repositorio explícitamente: Cada comando debe especificar explícitamente en qué repositorio se opera. Usar el formato org/repo en todos los comandos gh api o llamadas a la API de GitHub.

3. No mezclar repositorios: Nunca asumir que estamos en un directorio local específico. La aplicación puede estar visualizar cualquier repositorio del usuario, y cada operación debe ser aislada al repositorio actual.

### Validación Antes de Implementar

Antes de implementar o modificar cualquier función que use comandos externos (gh api, curl, git, etc.), SIEMPRE:

1. Validar el comando en terminal: Ejecutar el comando exacto o curl en la terminal para verificar que funciona.
2. Analizar la respuesta: Revisar el formato de salida (JSON, texto, errores) para entender exactamente qué devuelve.
3. Implementar con conocimiento exacto: Solo después de validar y analizar la respuesta, implementar la función basándose en el formato real.
4. EXCEPCIÓN - Operaciones de escritura: Si la operación modifica un repositorio (crear etiquetas, commits, etc.), CONSULTAR AL USUARIO antes de ejecutarla en producción.

### Tokens de Autenticación

Usar el token correcto para cada API:

- API de GitHub: Usar token de CLI de GitHub (gh auth token)
  - Obtener dinámicamente: gh auth token
  - NUNCA usar token de Seki para GitHub
  - NUNCA usar tokens codificados

- API de Seki: Usar token JWT de Seki
  - Almacenado en localStorage como seki_api_token
  - Configurado vía UI por el usuario
  - NUNCA usar token de gh para Seki

### Gestión de Permisos

Para verificar si un usuario puede crear etiquetas, usar el objeto permissions de API de GitHub:
- permissions.push
- permissions.maintain
- permissions.admin

Fallback a viewerPermission (legado):
- viewerPermission === WRITE
- viewerPermission === ADMIN
- viewerCanAdminister

### Gestión de Estado React Query

Después de operaciones de escritura (crear etiqueta, etc.), invalidar consultas relevantes y mantener estado local.

## Referencias
- Documentación principal: AGENTS.md
- ADRs relacionados: docs/adr/
