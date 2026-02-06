import { usePipeline } from '@/hooks/usePipeline'

function App() {
  const { data, isLoading, error } = usePipeline({
    product: 'Cencosud-xlabs/argentina-arcus',
    commit: '7444e639a53a74963ecabf147e7501b7aa2a6534',
  })

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Seki Web</h1>

      {isLoading && <p>Cargando pipeline...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
      {data && (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold">Pipeline State: {data.state}</h2>
            <p>Product: {data.git.product}</p>
            <p>Commit: {data.git.commit}</p>
            <p>Author: {data.git.commit_author}</p>
          </div>

          <div className="space-y-2">
            {data.events.map((event) => (
              <div key={event.id} className="p-3 border rounded">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    event.state === 'SUCCESS' ? 'bg-green-500' :
                    event.state === 'WARN' ? 'bg-yellow-500' :
                    event.state === 'STARTED' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-medium">{event.label.es}</span>
                  <span className="text-sm text-muted-foreground">({event.state})</span>
                </div>
                {event.subevents.length > 0 && (
                  <ul className="ml-4 mt-1 text-sm">
                    {event.subevents.map((sub) => (
                      <li key={sub.id} className="text-muted-foreground">
                        - {sub.label}: {sub.state}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
