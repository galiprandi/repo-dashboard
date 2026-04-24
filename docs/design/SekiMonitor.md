# SekiMonitor - Decisiones de Diseño y UX

Este documento captura las decisiones de diseño y UX tomadas durante el desarrollo del componente SekiMonitor. Antes de cualquier cambio, revisar este documento para evaluar el impacto y evitar regresiones.

## Contexto del Componente

SekiMonitor es un componente que muestra el estado de pipelines de CI/CD. Actualmente está integrado con la API de Seki, pero esta integración tiene las siguientes características importantes:

- **NO está disponible para todos los repositorios**: Solo repositorios que tienen Seki configurado
- **Arquitectura de plugin**: Seki se considera un plugin que da visibilidad del estado del pipeline
- **Extensibilidad planeada**: Planeamos agregar otros plugins como Pulsar o GitHub Actions en el futuro
- **Estado de advertencia**: Cuando un repositorio no tiene Seki configurado, se muestra un estado de advertencia (no error)

## Estados del Componente

### 1. Estado Cargando
**Decisión:** Mostrar indicador giratorio con mensaje "Cargando información del pipeline..."
**Por qué:**
- Retroalimentación visual al usuario que se está cargando información
- Indica que el sistema está trabajando activamente
- Consistente con patrones de UX estándar

**Implementación:**
- Tarjeta de estado con tipo `loading`
- Borde gris-200, texto gris-600
- Icono giratorio con animación
- Sin botón de cerrar (cargando no es descartable)

### 2. Estado Error
**Decisión:** Mostrar mensaje de error con botón de reintentar y cerrar
**Por qué:**
- Retroalimentación clara cuando falla la carga
- Botón de reintentar permite recuperación inmediata
- Botón de cerrar permite descartar errores transitorios
- Borde rojo para indicar criticidad

**Implementación:**
- Tarjeta de estado con tipo `error`
- Borde rojo-200, texto rojo-600
- Icono de círculo con X
- Botón "Reintentar" que recarga la página
- Botón X para cerrar (descartable)

### 3. Estado Advertencia (Sin Pipeline)
**Decisión:** Mostrar advertencia cuando no hay información de pipeline
**Por qué:**
- No todos los proyectos tienen pipeline Seki configurado
- La API puede no devolver información para ciertos stages
- No es un error crítico, es una situación esperada
- Permite descartar el mensaje si el usuario ya lo sabe

**Implementación:**
- Tarjeta de estado con tipo `warn`
- Borde ámbar-200, texto ámbar-700
- Icono de triángulo de advertencia
- Botón X para cerrar (descartable)
- Mensaje: "Información de Pipeline no disponible para este Stage."

### 4. Estado Sin Conexión
**Decisión:** Detectar desconexión de red y mostrar estado específico
**Por qué:**
- Retroalimentación clara cuando no hay conexión a internet
- Evita confusiones con errores de API
- Se actualiza automáticamente al conectar/desconectar
- Prioridad más alta que otros estados

**Implementación:**
- Tarjeta de estado con tipo `offline`
- Borde gris-300, texto gris-500
- Icono de WiFi apagado
- Mensaje: "Sin conexión a internet. Verifica tu conexión."
- Detectado con `navigator.onLine` y eventos `online/offline`
- Se muestra antes de cualquier otro estado

### 5. Estado Normal
**Decisión:** Mostrar información completa del pipeline cuando está disponible
**Por qué:**
- Es el estado principal del componente
- Proporciona toda la información relevante del pipeline
- Línea de tiempo visual con sugerencias interactivas

## Consulta y Optimización

### Estrategia de Consulta
**Decisión:** Consulta inteligente basada en estado del pipeline
**Por qué:**
- Evitar solicitudes innecesarias cuando el pipeline está quieto
- Consulta más frecuente cuando hay actividad real (sub-eventos)
- Balance entre tiempo real y carga en la API

**Implementación:**
- **30s** si el pipeline está en progreso (`started`, `in_progress`, `running`, `pending`)
- **15s** si hay sub-eventos STARTED/RUNNING (más frecuente para actividad granular)
- **Sin consulta** si está quieto
- Tiempo de obsolescencia de 5 segundos para evitar parpadeo

### Caché con ETag
**Decisión:** Implementar ETag para evitar transferir datos sin cambios
**Por qué:**
- Reduce carga en la API de Seki
- Ahorra ancho de banda
- Mejora rendimiento en conexiones lentas
- Respeta recursos del servidor

**Implementación:**
- Interceptor de solicitud: envía encabezado `If-None-Match` con ETag guardado
- Interceptor de respuesta: guarda ETag de respuestas en localStorage
- Si el servidor responde 304 No Modificado, no se transfieren datos

### Sin Consulta para Commits/Tags
**Decisión:** No hacer consulta automática de commits y tags
**Por qué:**
- Commits/tags cambian con menos frecuencia que pipelines
- El usuario puede presionar Actualizar manualmente
- Tiempo de obsolescencia de 30 segundos permite ver cambios recientes al navegar
- Evita solicitudes innecesarias

## Interacciones UX

### Sugerencias en Línea de Tiempo
**Decisión:** Sugerencias automáticas con posición dinámica
**Por qué:**
- Información contextual sin bloquear la vista
- Posición automática evita problemas de espacio
- Tarjeta de flotación de Radix UI es accesible y consistente

**Implementación:**
- Tarjeta de flotación con retraso de 100ms para abrir y cerrar
- Posición automática (sin lado fijo)
- Solo una sugerencia abierta a la vez para evitar solapamiento
- Sugerencia del evento en progreso se mantiene abierta por defecto

### Sugerencia del Evento en Progreso
**Decisión:** Mantener sugerencia del evento STARTED/RUNNING abierta por defecto
**Por qué:**
- El usuario necesita ver el progreso en tiempo real
- El evento activo es el más relevante
- Se puede cerrar manualmente haciendo clic en el botón del paso

**Implementación:**
- Estado `runningTooltipClosed` para cerrar manualmente
- Clic en el botón cierra la sugerencia del evento en ejecución

### Barra de Progreso
**Decisión:** Reemplazar "Progreso (7)" con barra de progreso visual
**Por qué:**
- Más visual e intuitivo
- Muestra porcentaje de completado
- Mejor experiencia de usuario para entender el estado

**Implementación:**
- Barra verde con altura 2px
- Contador al lado (ej: 5/7)
- Calcula porcentaje basado en sub-eventos EXITOSO/FALLO/ADVERTENCIA
- Animación suave de 500ms

### Modal para Markdown de Sub-eventos
**Decisión:** Mostrar markdown en modal al hacer clic en sub-evento
**Por qué:**
- Markdown puede ser largo y complejo
- Sugerencia es pequeña para contenido extenso
- Modal permite lectura cómoda
- Botón con icono de documento indica contenido disponible

**Implementación:**
- Componente de diálogo (estilo shadcn/ui)
- Ancho 60vw del viewport
- Solo muestra botón si el sub-evento tiene markdown
- Clic en el sub-evento abre el modal

## Estilos y Layout

### Altura Fija del Componente
**Decisión:** Altura fija de 82px para todas las tarjetas
**Por qué:**
- Consistencia visual en la UI
- Evita saltos de diseño al cambiar estados
- Mejor experiencia de usuario

### Borde Consistente
**Decisión:** Borde de 2px para todas las tarjetas
**Por qué:**
- Visibilidad consistente
- Separación clara del fondo
- Coincide con el estilo del SekiMonitor normal

### Layout Justificar-Entre
**Decisión:** Layout `justify-between` para todos los estados
**Por qué:**
- Consistencia entre cargando, error, advertencia, sin conexión
- Permite agregar botones a la derecha
- Mejor aprovechamiento del espacio horizontal

## Mensaje de Expiración del Token

### Posición Permanente
**Decisión:** El mensaje de expiración del token siempre visible
**Por qué:**
- El usuario necesita saber cuándo expira su token
- No debe desaparecer durante la carga
- Permite planificar renovación del token

**Implementación:**
- Movido fuera del condicional de carga
- Siempre visible cuando el token es válido
- Muestra "El token de autenticación expira X" y botón "Revocar acceso"

## Datos de Prueba

### Estados Completos en /mock-seki
**Decisión:** Incluir todos los estados en la página de prueba
**Por qué:**
- Permite prueba visual de todos los estados
- Facilita desarrollo y depuración
- Documenta los estados posibles

**Estados incluidos:**
- Cargando
- Error
- Sin Pipeline (advertencia)
- Normal (STARTED)

## Decisiones de No Implementación

### Carga con Esqueleto
**Decisión:** No implementar carga con esqueleto
**Por qué:**
- Indicador giratorio actual es suficiente
- Menos complejidad en el código
- Esqueleto es más útil cuando se conoce la estructura exacta del contenido

### Persistencia de Estados Descartables
**Decisión:** No persistir estados descartables en localStorage
**Por qué:**
- Los estados pueden cambiar entre sesiones
- El usuario puede querer ver el mensaje de nuevo
- Menos complejidad en la implementación

### Consulta para Commits/Tags
**Decisión:** No hacer consulta automática de commits y tags
**Por qué:**
- Commits/tags cambian con menos frecuencia
- El usuario puede presionar Actualizar manualmente
- Evita solicitudes innecesarias a GitHub API

## Consideraciones Futuras

### Posibles Mejoras
1. Carga con esqueleto en lugar de indicador giratorio (si se desea más moderno)
2. Persistencia de estados descartables (si el usuario lo prefiere)
3. Consulta agresiva para commits/tags (si se necesita tiempo real)
4. Transiciones suaves entre estados
5. Indicador más específico de qué se está cargando
6. Notificaciones push cuando el pipeline termina

### Antes de Implementar Cualquier Cambio
1. Revisar este documento
2. Evaluar impacto en estados existentes
3. Considerar efectos en consulta y ETag
4. Verificar consistencia con decisiones de UX
5. Pruebas en /mock-seki para todos los estados
