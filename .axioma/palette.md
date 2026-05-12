# Diario de Palette 🎨

## 2025-05-15 - Estandarización de Foco y Semántica en Header y Diálogos
**Aprendizaje:** El uso de elementos no semánticos (como `div`) para disparadores interactivos rompe la navegación por teclado y la accesibilidad de lectores de pantalla. Además, la falta de anillos de foco (`focus-visible`) en el header reduce la usabilidad para usuarios que no usan ratón. Radix UI requiere descripciones accesibles para evitar advertencias de consola y mejorar el contexto.
**Acción:** Reemplazar `div` por `button` con `aria-label`, implementar `focus-visible:ring-2 focus-visible:ring-primary` de forma consistente en todos los elementos interactivos del header y asegurar que `BaseDialog` siempre renderice un `Dialog.Description` (aunque sea `sr-only`).
