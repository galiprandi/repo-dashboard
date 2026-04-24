# ADR-0001: Consulta Inteligente para Estado del Pipeline

## Estado
Aceptado

## Contexto
ReleaseHub necesita mostrar el estado de pipelines de CI/CD en tiempo real. Consulta constante a intervalos fijos tiene problemas:
- Solicitudes innecesarias cuando el pipeline está quieto
- Carga excesiva en la API de Seki
- Latencia en detectar cambios cuando hay actividad
- Dificultad para balancear tiempo real vs carga en el servidor

## Decisión
Implementar consulta inteligente basada en el estado del pipeline y sus sub-eventos.

### Estrategia de Consulta
- **30 segundos** cuando el pipeline está en progreso (started, in_progress, running, pending)
- **15 segundos** cuando hay sub-eventos STARTED/RUNNING (más frecuente para actividad granular)
- **Sin consulta** cuando el pipeline está quieto (success, failed, cancelled)

### Configuración Adicional
- Tiempo de obsolescencia de 5 segundos para evitar parpadeo de datos
- Caché de 1 hora para mantener datos en memoria
- Función auxiliar para detectar actividad granular en sub-eventos

## Consecuencias

### Positivas
- Reducida carga en API: No se hace consulta cuando el pipeline está quieto
- Mejor tiempo real: Consulta más frecuente cuando hay actividad real
- Balance óptimo: 30s para progreso principal, 15s para sub-eventos activos
- Escalabilidad: Sistema puede manejar más repositorios simultáneamente

### Negativas
- Complejidad: Lógica más compleja que consulta constante
- Estado compartido: Requiere análisis del estado del pipeline
- Testing: Más difícil de testear que consulta simple

### Mitigaciones
- Documentación clara en docs/design/SekiMonitor.md
- Tests en /mock-seki para diferentes estados
- Funciones auxiliares reutilizables para lógica de estado

## Alternativas Consideradas

### Consulta constante
Ventajas: Simple, predecible
Desventajas: Solicitudes innecesarias, carga en API
Rechazado: No escala bien con muchos repositorios

### WebSockets
Ventajas: Tiempo real verdadero
Desventajas: Complejidad de implementación, requiere cambios en API
Rechazado: API de Seki no soporta WebSockets

### Server-Sent Events (SSE)
Ventajas: Push desde servidor
Desventajas: Requiere cambios en API, más complejo que consulta
Rechazado: API de Seki no soporta SSE

## Referencias
- Implementado en: src/hooks/usePipeline.ts
- Documentación de diseño: docs/design/SekiMonitor.md
