# Seki Web

Aplicación web para visualizar pipelines de CI/CD del ecosistema Seki (Cencosud-xlabs).

## Características

- Visualización de estados de pipelines en tiempo real
- Integración con API Seki BFF
- UI moderna con Tailwind CSS y componentes shadcn/ui
- Enrutamiento con TanStack Router
- Gestión de estado de servidor con TanStack Query

## Stack Tecnológico

- **Framework:** React 19 + Vite (Rolldown)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS 4
- **Enrutador:** TanStack Router
- **Data Fetching:** TanStack Query + Axios
- **Íconos:** Lucide React

## Requisitos

- Node.js (versión especificada en `.nvmrc`)
- npm

## Configuración

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Configurar `VITE_SEKI_API_URL` y `VITE_SEKI_API_TOKEN` en `.env`

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run preview` | Previsualizar build de producción |
| `npm run lint` | Ejecutar ESLint |

## Estructura del Proyecto

```
src/
├── api/           # Cliente API y tipos
├── hooks/         # Custom React hooks
├── lib/           # Utilidades
├── providers/     # React context providers
└── routes/        # Rutas de la aplicación
```

## Licencia

Proyecto privado - Cencosud-xlabs
