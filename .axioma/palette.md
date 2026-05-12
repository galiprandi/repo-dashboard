# Diario de Palette 🎨

## 2026-05-12 - Accesibilidad de disparadores en Header

**Aprendizaje:** Los iconos interactivos en el header (como el de Configuración) se implementaban como `div` con `onClick`, lo que impedía la navegación por teclado. Al convertirlos a `button`, es crucial no solo añadir el rol semántico, sino también un estado de foco visual (`focus-visible:ring-2`) que sea coherente con el diseño "premium" de la app pero claramente visible.

**Acción:** Al refactorizar disparadores de header, usar siempre `<button type="button">`, añadir `aria-label` descriptivo y aplicar la clase `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2 rounded-md`.
