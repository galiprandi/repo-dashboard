import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold hover:text-primary">
              Seki Dashboard
            </Link>
          </div>
        </header>
        <main className="p-4">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  ),
})
