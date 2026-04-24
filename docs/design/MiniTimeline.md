# MiniTimeline - Decisiones de Diseño y UX

Este documento captura las decisiones de diseño y UX tomadas durante el desarrollo del componente MiniTimeline. Antes de cualquier cambio, revisar este documento para evaluar el impacto y evitar regresiones.

## Propósito del Componente

MiniTimeline es una visualización horizontal de los eventos del pipeline con sugerencias interactivas que muestran detalles de cada evento y sus sub-eventos.

## Interacciones UX

### Sugerencias Automáticas
**Decisión:** Sugerencias que se abren al pasar el cursor con posición dinámica
**Por qué:**
- Información contextual sin bloquear la vista
- Posición automática evita problemas de espacio
- Tarjeta de flotación de Radix UI es accesible y consistente

**Detalles:**
- Retraso de 100ms para abrir y cerrar
- Posición automática sin lado fijo
- Solo una sugerencia abierta a la vez para evitar solapamiento
- Estado controlado por el cursor y estado del evento en progreso

### Sugerencia del Evento en Progreso
**Decisión:** Mantener sugerencia del evento STARTED/RUNNING abierta por defecto
**Por qué:**
- El usuario necesita ver el progreso en tiempo real
- El evento activo es el más relevante
- Se puede cerrar manualmente haciendo clic en el botón del paso

**Detalles:**
- Estado runningTooltipClosed para cerrar manualmente
- Clic en el botón cierra la sugerencia del evento en ejecución
- Reabre al pasar el cursor en otros eventos

### Barra de Progreso
**Decisión:** Barra de progreso visual en lugar de texto "Progreso (7)"
**Por qué:**
- Más visual e intuitivo
- Muestra porcentaje de completado
- Mejor experiencia de usuario para entender el estado

**Detalles:**
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

**Detalles:**
- Componente de diálogo (estilo shadcn/ui)
- Ancho 60vw del viewport
- Solo muestra botón si el sub-evento tiene markdown
- Clic en el sub-evento abre el modal
- Botón con icono de copiar para copiar URLs

## Estilos y Layout

### Línea de Tiempo Horizontal
**Decisión:** Línea de tiempo horizontal con botones para cada evento
**Por qué:**
- Aprovecha mejor el espacio horizontal
- Permite ver todos los eventos a la vez
- Consistente con patrones de línea de tiempo estándar

**Detalles:**
- Separación mínima entre botones
- Botones con forma circular
- Color del botón indica estado del evento

### Colores por Estado
**Decisión:** Colores específicos para cada estado del evento
**Por qué:**
- Identificación rápida del estado
- Consistencia visual
- Accesibilidad (diferencia de color + icono)

**Colores:**
- STARTED/RUNNING: Azul
- SUCCESS: Verde
- FAILED: Rojo
- CANCELLED: Gris
- PENDING: Amarillo

### Botones de Copia de URLs
**Decisión:** Botones pequeños para copiar URLs de sub-eventos
**Por qué:**
- Facilita compartir URLs de registros o recursos
- Retroalimentación visual al copiar
- No interfiere con la lectura de la sugerencia

**Detalles:**
- Icono de copiar de Lucide
- Retroalimentación con marca de verificación al copiar
- Etiqueta para accesibilidad
- Tiempo de espera para revertir al estado original

## Decisiones de No Implementación

### Sugerencia Vertical
**Decisión:** No implementar línea de tiempo vertical
**Por qué:**
- Línea de tiempo horizontal aprovecha mejor el espacio en escritorio
- El componente está diseñado para ser horizontal dentro de SekiMonitor
- Menos desplazamiento necesario

### Zoom en Línea de Tiempo
**Decisión:** No implementar zoom o desplazamiento en línea de tiempo
**Por qué:**
- Número limitado de eventos (típicamente menos de 10)
- No hay necesidad de zoom con pocos eventos
- Añadiría complejidad innecesaria

### Arrastrar y Soltar de Eventos
**Decisión:** No implementar reordenamiento de eventos
**Por qué:**
- El orden de eventos está determinado por el pipeline
- No tiene sentido reordenar eventos en una línea de tiempo de CI/CD
- Añadiría complejidad sin valor

## Consideraciones Futuras

### Posibles Mejoras
1. Línea de tiempo vertical para móvil (adaptable)
2. Zoom/desplazamiento si el número de eventos crece significativamente
3. Animaciones de transición entre estados
4. Indicador de duración de cada evento
5. Filtros por tipo de evento

### Antes de Implementar Cualquier Cambio
1. Revisar este documento
2. Evaluar impacto en interacciones existentes
3. Considerar efectos en SekiMonitor (componente padre)
4. Verificar consistencia con decisiones de UX
5. Pruebas en /mock-seki para diferentes estados

## Referencias
- Implementado en: src/components/SekiMonitor/MiniTimeline.tsx
- Documentación de diseño: docs/design/SekiMonitor.md
- ADR relacionado: docs/adr/0001-consulta-inteligente.md
