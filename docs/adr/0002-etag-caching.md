# ADR-0002: Caché con ETag para Optimización de Consultas

## Estado
Aceptado

## Contexto
ReleaseHub hace consultas frecuentes a la API de Seki para obtener el estado de pipelines. Cada solicitud transfiere datos completos incluso cuando no hay cambios, resultando en:
- Ancho de banda desperdiciado
- Carga innecesaria en el servidor
- Latencia en conexiones lentas
- Escalabilidad limitada con muchos repositorios

## Decisión
Implementar caché con ETag usando solicitudes condicionales HTTP para evitar transferir datos sin cambios.

### Flujo
1. Primera solicitud: No hay ETag guardado, servidor responde con datos + ETag
2. Guardar ETag en localStorage con clave específica por URL
3. Segunda solicitud: Enviar encabezado If-None-Match con ETag guardado
4. Si no hay cambios: Servidor responde 304 No Modificado (sin datos)
5. Si hay cambios: Servidor responde con datos nuevos + nuevo ETag

### Implementación
- Interceptor de solicitud: Enviar encabezado If-None-Match con ETag guardado
- Interceptor de respuesta: Guardar ETag de respuestas en localStorage
- Claves específicas por URL para evitar colisiones

## Consecuencias

### Positivas
- Reducción de ancho de banda: No se transfieren datos si no hay cambios
- Menos carga en servidor: Servidor no necesita generar respuesta completa
- Mejor rendimiento: Respuestas 304 son más rápidas
- Escalabilidad: Sistema puede manejar más consultas concurrentes

### Negativas
- Complejidad: Requiere interceptores de Axios
- LocalStorage: ETags persisten en el navegador
- Invalidación: ETags pueden quedar obsoletos si el servidor cambia lógica

### Mitigaciones
- ETags se invalidan automáticamente cuando hay cambios
- Claves específicas por URL para evitar colisiones
- Documentación clara en código para mantenimiento

## Alternativas Consideradas

### Sin ETag
Ventajas: Simple, sin estado
Desventajas: Ancho de banda desperdiciado
Rechazado: No escala bien con consultas frecuentes

### Caché en memoria
Ventajas: Integración nativa con React Query
Desventajas: Solo caché en memoria, no reduce transferencia de datos
Rechazado: No optimiza solicitudes de red

### Service Worker con caché
Ventajas: Caché más robusto
Desventajas: Complejidad significativa, excesivo para este caso
Rechazado: Demasiado complejo para el beneficio

## Referencias
- Implementado en: src/api/seki.ts
- Documentación de diseño: docs/design/SekiMonitor.md
- RFC 7232: Solicitudes Condicionales HTTP
