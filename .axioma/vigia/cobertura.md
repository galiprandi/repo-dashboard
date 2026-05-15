## 2025-05-22 - sekiToken.ts | +100% | tests in same dir + CI
## 2026-05-09 - sekiAdapter.ts | Cobertura Ganada: [+40%] | Aprendizaje: Mocks minimalistas de axios para asegurar lógica de transformación sin exceder límites de líneas.
## 2026-05-10 - sekiAdapter.ts | Cobertura Ganada: [+35%] | Aprendizaje: Implementación de tests para modo 'tags' y transformación de subeventos, asegurando la robustez del adaptador unificado.
## 2026-05-11 - FeedbackDialog.tsx | Cobertura Recuperada: [50%] | Aprendizaje: Uso de QueryClientProvider con instancia fresca por test y estabilización de mocks de hooks de terceros (@galiprandi/react-tools) para mejorar mantenibilidad.
## 2026-05-12 - useRepoPermission.ts | Cobertura Ganada: [+100%] | Aprendizaje: Validación de manejo de JSON inválido en la salida de comandos de CLI gh, asegurando estabilidad frente a errores silenciosos de parsing.
## 2026-05-13 - pulsarAdapter.ts | Cobertura Ganada: [+85%] | Aprendizaje: Uso de mockResolvedValueOnce para simular flujos multi-comando de GH CLI (ID de workflow -> runs -> jobs -> commit info).
## 2026-05-14 - docker.ts | Cobertura Ganada: [+30%] | Aprendizaje: Creación de tests unitarios iniciales para el módulo de Docker, mockeando runCommand para validar la lógica de parsing básica.
## 2026-05-15 - src/api/seki.ts | Cobertura Ganada: [+5%] | Aprendizaje: El uso de `vi.spyOn(apiSeki, 'get')` permite testear funciones de alto nivel que dependen de instancias de axios configuradas con serializadores complejos sin necesidad de mockear axios globalmente.
