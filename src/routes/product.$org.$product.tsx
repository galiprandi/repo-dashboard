import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchPipelineWithTag } from '@/api/seki'
import { useFavorites } from '@/hooks/useFavorites'
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
  ArrowLeft,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/product/$org/$product')({
  component: ProductDetail,
})

function ProductDetail() {
  const { org, product } = Route.useParams()
  const fullProduct = `${org}/${product}`
  const { isFavorite, toggleFavorite } = useFavorites()
  const [activeStage, setActiveStage] = useState<'staging' | 'production'>('staging')

  const favorite = isFavorite(fullProduct)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>
          <h1 className="text-2xl font-bold">{fullProduct}</h1>
        </div>
        <button
          onClick={() => toggleFavorite(fullProduct)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
            favorite
              ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
              : 'hover:bg-muted'
          }`}
        >
          <Star className={`w-5 h-5 ${favorite ? 'fill-current' : ''}`} />
          {favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        </button>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveStage('staging')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeStage === 'staging'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          Staging
        </button>
        <button
          onClick={() => setActiveStage('production')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeStage === 'production'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="w-4 h-4" />
          Production
        </button>
      </div>

      {/* Stage Detail */}
      <StageDetail org={org} product={product} stage={activeStage} />
    </div>
  )
}

interface StageDetailProps {
  org: string
  product: string
  stage: 'staging' | 'production'
}

function StageDetail({ org, product, stage }: StageDetailProps) {
  const fullProduct = `${org}/${product}`
  const [commit, setCommit] = useState('')
  const [tag, setTag] = useState('')

  const { data: pipeline, isLoading, error } = useQuery({
    queryKey: ['pipeline', fullProduct, stage, commit, tag],
    queryFn: async () => {
      if (!commit) return null
      if (stage === 'production' && !tag) return null
      
      // Use the specific endpoint that works (commit/tag)
      const response = await fetchPipelineWithTag(
        fullProduct,
        commit,
        stage === 'production' ? tag : commit
      )
      return response.data
    },
    enabled: !!commit && (stage === 'staging' || !!tag),
  })

  // Form to input commit/tag
  if (!commit || (stage === 'production' && !tag)) {
    return (
      <div className="p-8 border rounded-lg text-center space-y-4">
        <GitCommit className="w-12 h-12 mx-auto text-muted-foreground" />
        <h3 className="font-medium">Ingresar versión para ver</h3>
        <div className="max-w-md mx-auto space-y-3">
          <input
            type="text"
            value={commit}
            onChange={(e) => setCommit(e.target.value)}
            placeholder={stage === 'staging' ? 'Commit SHA (ej: d7e07f6...)' : 'Commit SHA'}
            className="w-full px-3 py-2 border rounded-md"
          />
          {stage === 'production' && (
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag (ej: v2.2.3)"
              className="w-full px-3 py-2 border rounded-md"
            />
          )}
          <button
            onClick={() => {}} // Triggered by state change enabling the query
            disabled={!commit || (stage === 'production' && !tag)}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            Ver Pipeline
          </button>
          <p className="text-sm text-muted-foreground">
            Ejemplo: Commit <code>d7e07f63cedb3029b6ead5144ee8e25b54349462</code>
            {stage === 'production' && (
              <>, Tag <code>v2.2.3</code></>
            )}
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 text-red-700">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          Error al cargar el pipeline
        </div>
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="p-8 border rounded-lg text-center text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay pipelines de {stage}</p>
        <p className="text-sm">
          Los pipelines aparecerán aquí cuando haya deployments en este ambiente.
        </p>
      </div>
    )
  }

  const version =
    stage === 'staging'
      ? pipeline.git.commit
      : pipeline.git.ref.replace('refs/tags/', '')

  const completedEvents = pipeline.events.filter((e) =>
    ['SUCCESS', 'WARN', 'FAILED'].includes(e.state)
  ).length
  const totalEvents = pipeline.events.length
  const progressPercent = Math.round((completedEvents / totalEvents) * 100)

  return (
    <div className="space-y-6">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Estado</div>
          <StatusBadge state={pipeline.state} size="lg" />
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Versión</div>
          <div className="flex items-center gap-2 font-mono text-lg">
            {stage === 'staging' ? (
              <GitCommit className="w-4 h-4" />
            ) : (
              <Tag className="w-4 h-4" />
            )}
            {stage === 'staging' ? version.slice(0, 7) : version}
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Progreso</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Git Info */}
      <div className="p-4 border rounded-lg space-y-2">
        <h3 className="font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Información del commit
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Autor:</span>{' '}
            {pipeline.git.commit_author}
          </div>
          <div>
            <span className="text-muted-foreground">Fecha:</span>{' '}
            {new Date(pipeline.updated_at).toLocaleString()}
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground">Mensaje:</span>
            <p className="mt-1 font-mono text-xs bg-muted p-2 rounded">
              {pipeline.git.commit_message}
            </p>
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="space-y-2">
        <h3 className="font-medium">Pasos del pipeline</h3>
        <div className="space-y-2">
          {pipeline.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }: { event: { id: string; label: { es: string }; state: string; subevents: Array<{ id: string; label: string; state: string }> } }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StatusIcon state={event.state} />
          <span className="font-medium">{event.label.es}</span>
          <span className="text-xs text-muted-foreground uppercase">
            {event.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge state={event.state} />
          <span className="text-muted-foreground">
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </button>
      {expanded && event.subevents.length > 0 && (
        <div className="border-t bg-muted/30 p-3 space-y-1">
          {event.subevents.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted"
            >
              <span className="text-sm">{sub.label}</span>
              <StatusBadge state={sub.state} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusIcon({ state }: { state: string }) {
  const icons: Record<string, React.ReactNode> = {
    SUCCESS: <CheckCircle2 className="w-5 h-5 text-lime-500" />,
    STARTED: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
    FAILED: <XCircle className="w-5 h-5 text-red-500" />,
    WARN: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    IDLE: <Clock className="w-5 h-5 text-gray-400" />,
  }
  return icons[state] || icons.IDLE
}

function StatusBadge({
  state,
  size = 'md',
}: {
  state: string
  size?: 'sm' | 'md' | 'lg'
}) {
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

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.className} ${sizeClasses[size]}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}
