# ReleaseHub

Web application for visualizing CI/CD pipelines and managing GitHub releases.

## 🎯 Architecture & Disruption

ReleaseHub represents a paradigm shift in deployment tooling by combining cutting-edge technologies in a stateless, browser-based architecture:

- **Vite Middleware Terminal Execution**: Executes terminal commands remotely through a custom Vite middleware, eliminating the need for local repository clones while maintaining security and isolation
- **TanStack Query v5 + LocalStorage Adapter**: Implements sophisticated server state management with intelligent caching, optimistic updates, and offline persistence through a custom localStorage adapter
- **Built-in AI APIs**: Leverages native browser AI capabilities to generate intelligent summaries for logs and commit diffs, providing actionable insights without external dependencies
- **Multi-Repository Remote Operations**: Uses GitHub CLI (`gh`) for all remote operations (tags, commits, deployments), enabling management of dozens of repositories simultaneously without local git operations

This architecture makes ReleaseHub highly disruptive: it transforms complex deployment workflows into a seamless web experience, reduces developer cognitive load through AI-powered insights, and eliminates the traditional requirement of local development environments for release management.

## 🚀 Quick Install & Launch

Run the following command to install or update ReleaseHub and launch it immediately:

```bash
curl -sSL https://raw.githubusercontent.com/galiprandi/release-hub/main/scripts/install.sh | bash
```

Once installed, you can launch the app anytime by simply typing:

```bash
rhub
```


## Features

- Real-time pipeline status visualization
- Integration with CI/CD API
- Modern UI with Tailwind CSS and shadcn/ui components
- Routing with TanStack Router
- Server state management with TanStack Query

## Release Strategy

ReleaseHub follows a **Trunk-Based Development** model with **Tag-based promotion**:

- **Staging**: Automatically deploys the latest commits from the `main` branch.
- **Production**: Deploys are triggered manually by creating a **GitHub Tag**, promoting a validated version from Staging to Production.

The app leverages the **GitHub CLI (`gh`)** to perform these operations remotely, ensuring it remains stateless and can manage multiple repositories without local clones.

## 🛠️ Tech Stack

ReleaseHub leverages cutting-edge, production-ready technologies at the forefront of web development:

### Core Framework
- **React 19**: Latest React with improved rendering and concurrent features
- **Vite (Rolldown)**: Next-generation bundler with Rollup-powered fast builds
- **TypeScript**: Type-safe development with strict mode enabled

### State & Data Management
- **TanStack Query v5**: Advanced server state management with:
  - Intelligent caching and stale-while-revalidate strategies
  - Optimistic updates for seamless UX
  - Background refetching and automatic retries
  - Custom localStorage adapter for offline persistence
- **TanStack Router**: File-based routing with type-safe route parameters and loaders

### UI & Styling
- **Tailwind CSS 4**: Latest utility-first CSS framework with improved performance
- **shadcn/ui**: Modern, accessible component library built on Radix UI primitives
- **Lucide React**: Consistent icon system

### AI & Automation
- **Built-in Browser AI APIs**: Native Web AI for intelligent log and commit diff summarization
- **GitHub CLI (`gh`)**: Remote repository operations without local git clones
- **Kubernetes CLI (`kubectl`)**: Direct cluster integration for deployment monitoring

### Development Tools
- **ESLint**: Modern linting with flat config
- **Prettier**: Code formatting with consistent style
- **Vitest**: Fast unit testing framework

## Requirements

- Node.js (v22+)
- npm (standardized as default package manager)
- GitHub CLI (`gh`) authenticated
- Kubernetes CLI (`kubectl`) - *Optional (required for K8s features)*
- jq (JSON processor)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
## Available Scripts

| Command | Description |
|---------|-------------|
| `rhub` | Launch the app (after installation) |
| `npm run doctor` | Run environment healthcheck |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── api/           # API client and types
├── hooks/         # Custom React hooks
├── lib/           # Utilities
├── providers/     # React context providers
└── routes/        # Application routes
```

## License

MIT License
