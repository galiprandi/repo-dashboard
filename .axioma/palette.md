# Diario de Palette 🎨

## 2026-05-13 - Estandarización de estados de foco y accesibilidad

**Aprendizaje:** Los componentes compartidos como `IconButton` y `FilterBar` carecían de estados de foco visuales claros y atributos ARIA necesarios para una buena experiencia con lectores de pantalla. Al aplicar `focus-visible:ring-2 focus-visible:ring-primary` de forma consistente, se mejora la navegación por teclado sin comprometer la estética para usuarios de ratón. Además, el uso de `aria-pressed` en botones de filtro comunica correctamente el estado activo que antes solo era visual.

**Acción:** Siempre incluir anillos de foco (`focus-visible:ring-2 focus-visible:ring-primary`) en elementos interactivos y asegurar atributos ARIA (`aria-label`, `aria-pressed`) que reflejen el estado y propósito del componente.

## 2026-05-15 - Accesibilidad por teclado en tooltips nativos

**Aprendizaje:** El uso de atributos `title` para tooltips en elementos no interactivos (como un `span`) oculta información crítica a usuarios de teclado. Al añadir `tabIndex={0}` y estilos de foco (`focus-visible:ring-2`), estos elementos se vuelven accesibles, permitiendo que el navegador muestre el tooltip nativo al recibir el foco.

**Acción:** Siempre que un elemento no interactivo use `title` para proporcionar información extra (como fechas completas o mensajes largos), añadir `tabIndex={0}` y anillos de foco para asegurar la accesibilidad por teclado.
