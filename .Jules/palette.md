## 2025-05-15 - Navegación por teclado en búsquedas rápidas
**Learning:** Los componentes de búsqueda que aparecen mediante atajos de teclado (como Cmd+K) deben soportar navegación completa con flechas y Enter para mantener la fluidez de la experiencia "keyboard-first".
**Action:** Implementar siempre un estado de `selectedIndex` y manejadores de eventos `keydown` para `ArrowUp`, `ArrowDown` y `Enter` en dropdowns de búsqueda.

## 2025-05-15 - Accesibilidad en formularios minimalistas
**Learning:** En formularios con pocos campos donde se omiten los `<label>` visuales por estética, los atributos `aria-label` son obligatorios para que los lectores de pantalla puedan identificar el propósito de los inputs.
**Action:** Verificar que todos los `<input>` sin etiquetas visibles tengan un `aria-label` descriptivo.
