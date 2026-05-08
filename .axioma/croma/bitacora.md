# Diario de Croma - Bitácora de UX

Este diario registra los hallazgos y decisiones de diseño para mejorar la experiencia de usuario y accesibilidad del proyecto.

---

## 2025-05-15 - Accesibilidad en Selectores de Proyecto | Aprendizaje: Los selectores de proyecto carecían de cierres automáticos (click-outside/Esc) y roles ARIA, lo que dificulta la navegación por teclado y la limpieza de la UI. | Acción: Implementar detección de click-outside, soporte para tecla Escape y roles ARIA (combobox/listbox) en componentes de selección.

## 2026-05-08 - Accesibilidad en Steppers de Diálogos | Aprendizaje: Los steppers visuales en diálogos (como FeedbackDialog) carecían de atributos ARIA apropiados, impidiendo que usuarios de lectores de pantalla entendieran el progreso y estado del formulario. | Acción: Implementar role="stepper", aria-current="step" para el paso activo, aria-label descriptivo en cada botón del stepper, aria-disabled para pasos no navegables, y aria-hidden="true" en elementos decorativos.
