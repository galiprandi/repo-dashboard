# ReleaseHub Design System & Patterns

Este documento detalla los patrones de diseño y UX establecidos para asegurar la consistencia visual y accesibilidad en toda la aplicación.

## Colores y Temas
- **Primario**: Usar siempre la variable `primary` (`bg-primary`, `text-primary`) para acciones principales y estados de énfasis. Evitar colores hardcoded como `blue-600`.
- **Superficies**: Utilizar `bg-background` para el fondo principal y `bg-muted` o `bg-muted/30` para secciones secundarias o cards.
- **Badges**:
  - Production: `bg-purple-100 text-purple-700`
  - Staging/Default: `bg-primary/10 text-primary`

## Accesibilidad (a11y)
- **Anillos de Foco**: Todos los elementos interactivos deben usar el patrón:
  `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 rounded-md`
- **Botones con Iconos**: Deben incluir siempre un `aria-label` descriptivo.
- **Secciones Expandibles**: Deben usar `aria-expanded` en el trigger y `aria-controls` apuntando al ID del contenido. Para ocultar el contenido colapsado, preferir clases de CSS (ej: `hidden`, `max-h-0`) en lugar de `aria-hidden`, a menos que el contenido sea puramente decorativo.

## Componentes Compartidos
- **FilterBar**: Utilizar para todas las vistas que requieran filtrado por categorías y búsqueda textual.
- **BaseDialog**: Wrapper obligatorio para todos los diálogos y modales del sistema.
- **DisplayInfo**: Componente estándar para mostrar metadatos de commits y pipelines con soporte nativo para tooltips accesibles.

## Health Monitoring
- Los servicios de salud deben agruparse por Producto.
- El header de cada producto debe usar `bg-muted/30` para separación visual.
- Las filas de endpoints deben proporcionar feedback visual claro al hover (`bg-muted/50`) y foco.
