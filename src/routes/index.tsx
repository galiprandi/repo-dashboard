import { createFileRoute, Link } from '@tanstack/react-router'
import { useFavorites } from '@/hooks/useFavorites'
import { listPipelines } from '@/api/seki'
import { useQuery } from '@tanstack/react-query'
import {
  GitCommit,
  Tag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  User,
  Star,
  Plus,
  Search,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { favorites, toggleFavorite } = useFavorites()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newProduct, setNewProduct] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Agregar Producto
        </button>
      </div>

      {/* Staging Table */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-blue-500" />
          Favoritos Staging
        </h2>
        <FavoritesTable
          favorites={favorites}
          stage="staging"
          event="commit"
          onToggleFavorite={toggleFavorite}
        />
      </section>

      {/* Production Table */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Tag className="w-5 h-5 text-purple-500" />
          Favoritos Production
        </h2>
        <FavoritesTable
          favorites={favorites}
          stage="production"
          event="tag"
          onToggleFavorite={toggleFavorite}
        />
      </section>

      {/* Add Product Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Agregar Producto</h3>
            <p className="text-sm text-muted-foreground">
              Ingresa el nombre del producto en formato org/product
            </p>
            <input
              type="text"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              placeholder="Cencosud-xlabs/yumi-iam"
              className="w-full px-3 py-2 border rounded-md"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (newProduct.includes('/')) {
                    toggleFavorite(newProduct)
                    setNewProduct('')
                    setShowAddDialog(false)
                  }
                }}
                disabled={!newProduct.includes('/')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                <Star className="w-4 h-4 inline mr-1" />
                Agregar a Favoritos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FavoritesTableProps {
  favorites: string[]
  stage: 'staging' | 'production'
  event: 'commit' | 'tag'
  onToggleFavorite: (product: string) => void
}

function FavoritesTable({
  favorites,
  stage,
  event,
  onToggleFavorite,
}: FavoritesTableProps) {
  const filteredFavorites = favorites.filter((f) => f.includes('/'))

  if (filteredFavorites.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay favoritos en {stage}</p>
        <p className="text-sm">Agrega productos usando el botón +</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium">Producto</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Versión</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Estado</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Actualizado</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Autor</th>
            <th className="px-4 py-2 text-center text-sm font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredFavorites.map((product) => (
            <FavoriteRow
              key={`${product}-${stage}`}
              product={product}
              stage={stage}
              event={event}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface FavoriteRowProps {
  product: string
  stage: 'staging' | 'production'
  event: 'commit' | 'tag'
  onToggleFavorite: (product: string) => void
}

function FavoriteRow({
  product,
  stage,
  event,
  onToggleFavorite,
}: FavoriteRowProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pipeline', product, stage, 'latest'],
    queryFn: async () => {
      // Fetch recent pipelines without complex filters to avoid 500 errors
      const response = await listPipelines(product, {
        limit: 50,
      })
      // Filter client-side by stage and event
      const items = response.data.items
      const matching = items.find(
        (item) => item.git.stage === stage && item.git.event === event
      )
      return matching || null
    },
    retry: 1,
  })

  const [org, name] = product.split('/')

  if (isLoading) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando {product}...
          </div>
        </td>
      </tr>
    )
  }

  if (error || !data) {
    return (
      <tr className="border-t">
        <td className="px-4 py-3">
          <Link
            to="/product/$org/$product"
            params={{ org, product: name }}
            className="text-blue-500 hover:underline"
          >
            {product}
          </Link>
        </td>
        <td colSpan={4} className="px-4 py-3 text-muted-foreground text-sm">
          {error ? 'Error al cargar' : 'Sin pipelines'}
        </td>
        <td className="px-4 py-3 text-center">
          <button
            onClick={() => onToggleFavorite(product)}
            className="text-yellow-500 hover:text-yellow-600"
            title="Quitar de favoritos"
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        </td>
      </tr>
    )
  }

  const version =
    stage === 'staging'
      ? data.git.commit.slice(0, 7)
      : data.git.ref.replace('refs/tags/', '')

  return (
    <tr className="border-t hover:bg-muted/50">
      <td className="px-4 py-3">
        <Link
          to="/product/$org/$product"
          params={{ org, product: name }}
          className="font-medium hover:text-primary"
        >
          {product}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm font-mono">
          {stage === 'staging' ? (
            <GitCommit className="w-3 h-3" />
          ) : (
            <Tag className="w-3 h-3" />
          )}
          {version}
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge state={data.state} />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(data.updated_at)}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {data.git.commit_author}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleFavorite(product)}
          className="text-yellow-500 hover:text-yellow-600"
          title="Quitar de favoritos"
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      </td>
    </tr>
  )
}

function StatusBadge({ state }: { state: string }) {
  const configs: Record<
    string,
    { icon: React.ReactNode; className: string; label: string }
  > = {
    SUCCESS: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      className: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
      label: 'Success',
    },
    STARTED: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      label: 'Running',
    },
    FAILED: {
      icon: <XCircle className="w-4 h-4" />,
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      label: 'Failed',
    },
    WARN: {
      icon: <AlertTriangle className="w-4 h-4" />,
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      label: 'Warning',
    },
    IDLE: {
      icon: <Clock className="w-4 h-4" />,
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      label: 'Idle',
    },
  }

  const config = configs[state] || configs.IDLE

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`
  return date.toLocaleDateString()
}
