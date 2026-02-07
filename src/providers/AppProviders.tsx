import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
// import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { type ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 24 * 60 * 60 * 1000, // 24 horas en caché
      retry: 2,
      refetchOnWindowFocus: true,
      placeholderData: (previousData: unknown) => previousData,
    },
  },
})

// const persister = createSyncStoragePersister({
//   storage: window.localStorage,
//   key: 'seki-query-cache',
// })

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
