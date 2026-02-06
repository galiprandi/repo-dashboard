import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { RepoSearch } from '@/components/RepoSearch'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold hover:text-primary">
              Seki Dashboard
            </Link>
            <RepoSearch />
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
