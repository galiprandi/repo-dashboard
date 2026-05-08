# ADR 0004: Organización de Tests Unitarios

## Estatus
Aceptado

## Contexto
El proyecto utiliza Vitest para pruebas unitarias. Inicialmente, algunos tests se colocaron en carpetas `__tests__`.

## Decisión
Para mejorar la navegabilidad y mantener la cohesión, los archivos de test unitarios (`.test.ts`, `.test.tsx`) se ubicarán en el **mismo directorio** que el código fuente que prueban.

Ejemplo:
- `src/utils/math.ts`
- `src/utils/math.test.ts`

## Consecuencias
- Mayor facilidad para encontrar tests relacionados.
- Menor fricción al crear nuevos tests.
- Se debe evitar el uso de carpetas `__tests__` para tests unitarios atómicos.
