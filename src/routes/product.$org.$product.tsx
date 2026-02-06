import { GitRefItem } from '@/components/GitRefItem'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useGitRepoInfo } from '@/hooks/useGitRepoInfo'
import { useFavorites } from '@/hooks/useFavorites'
import { useCommit } from '@/hooks/useCommit'
import {
  GitCommit,
  Tag,
  Loader2,
  Clock,
  User,
  Star,
  ArrowLeft,
  ArrowRight,
  FileCode,
  Calendar,
  Hash,
  Plus,
  Minus,
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{fullProduct}</h1>
            <button
              onClick={() => toggleFavorite(fullProduct)}
              className="p-1 hover:bg-muted rounded-md transition-colors"
              title={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Star className={`w-6 h-6 ${favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Last Deploy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LastDeployCard
          org={org}
          product={product}
          stage="staging"
          title="Último Deploy Staging"
          icon={<GitCommit className="w-5 h-5" />}
          color="blue"
        />
        <LastDeployCard
          org={org}
          product={product}
          stage="production"
          title="Último Deploy Production"
          icon={<Tag className="w-5 h-5" />}
          color="purple"
        />
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

  const { data: gitData, isLoading, error } = useGitRepoInfo({
    repo: fullProduct,
  })

  // Get data based on stage
  const commitHash = stage === 'staging' ? gitData?.commits[0]?.hash : gitData?.tags[0]?.commit
  
  // Use useCommit for detailed commit info when in staging mode
  const { data: commitDetails, isLoading: isLoadingCommit } = useCommit({
    repo: fullProduct,
    commitHash,
    enabled: stage === 'staging' && !!commitHash,
  })

  const tag = gitData?.tags[0]

  const author = stage === 'staging' 
    ? (commitDetails?.author || gitData?.commits[0]?.author)
    : commitDetails?.author
  const date = stage === 'staging' 
    ? (commitDetails?.date || gitData?.commits[0]?.date)
    : tag?.date
  const message = stage === 'staging' 
    ? (commitDetails?.message || gitData?.commits[0]?.message)
    : `Tag: ${tag?.name}`

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
          Error al cargar información de git
        </div>
      </div>
    )
  }

  const firstCommit = gitData?.commits[0]

  if (!firstCommit && !tag) {
    return (
      <div className="p-8 border rounded-lg text-center text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay información de {stage}</p>
        <p className="text-sm">
          No se encontraron {stage === 'staging' ? 'commits' : 'tags'} en el repositorio.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Versión</div>
          <GitRefItem
            type={stage === 'staging' ? 'commit' : 'tag'}
            hash={firstCommit?.hash}
            name={tag?.name}
            message={firstCommit?.message}
            author={firstCommit?.author}
            date={stage === 'staging' ? firstCommit?.date : tag?.date}
            org={org}
            repo={product}
            navigateOnClick
            stage={stage}
          />
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Fuente</div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <Clock className="w-3 h-3" />
              Desde Git
            </span>
          </div>
        </div>
      </div>

      {/* Git Info */}
      <div className="p-4 border rounded-lg space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Información de {stage === 'staging' ? 'commit' : 'tag'}
        </h3>
        
        {stage === 'staging' && isLoadingCommit ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando detalles del commit...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Hash */}
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Hash:</span>
              <span className="font-mono">{commitDetails?.shortHash || commitHash?.slice(0, 7) || '-'}</span>
            </div>
            
            {/* Author */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Autor:</span>
              <span>{author || 'Unknown'}</span>
              {commitDetails?.email && (
                <span className="text-muted-foreground text-xs">({commitDetails.email})</span>
              )}
            </div>
            
            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fecha:</span>
              <span>{date ? new Date(date).toLocaleString() : '-'}</span>
            </div>
            
            {/* Stats - only for staging with commit details */}
            {stage === 'staging' && commitDetails?.stats && (
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cambios:</span>
                <span className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <Plus className="w-3 h-3" />
                    {commitDetails.stats.insertions}
                  </span>
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <Minus className="w-3 h-3" />
                    {commitDetails.stats.deletions}
                  </span>
                  <span className="text-muted-foreground">
                    ({commitDetails.stats.filesChanged} archivos)
                  </span>
                </span>
              </div>
            )}
            
            {/* Subject */}
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Asunto:</span>
              <p className="mt-1 font-medium">
                {commitDetails?.subject || message?.split('\n')[0] || '-'}
              </p>
            </div>
            
            {/* Body - if available */}
            {commitDetails?.body && (
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Descripción:</span>
                <p className="mt-1 text-muted-foreground whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded">
                  {commitDetails.body}
                </p>
              </div>
            )}
            
            {/* Changed files - only for staging */}
            {stage === 'staging' && commitDetails?.files && commitDetails.files.length > 0 && (
              <div className="md:col-span-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Archivos modificados:
                </span>
                <div className="mt-1 max-h-32 overflow-y-auto bg-muted rounded p-2">
                  <ul className="text-xs font-mono space-y-1">
                    {commitDetails.files.map((file) => (
                      <li key={file} className="truncate">{file}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Commits/Tags Table */}
      <div className="p-4 border rounded-lg space-y-2">
        <h3 className="font-medium">
          {stage === 'staging' ? 'Commits recientes' : 'Tags disponibles'}
        </h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">
                  {stage === 'staging' ? 'Hash' : 'Tag'}
                </th>
                <th className="px-4 py-2 text-left font-medium">Fecha</th>
                <th className="px-4 py-2 text-left font-medium">Autor</th>
                <th className="px-4 py-2 text-left font-medium">Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {stage === 'staging'
                ? gitData?.commits
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((c) => (
                      <tr key={c.hash} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Link
                            to="/product/$org/$product"
                            params={{ org, product }}
                            search={{ stage: 'staging', event: 'commit' }}
                            className="font-mono text-xs hover:text-primary"
                          >
                            {c.hash.slice(0, 7)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {c.date ? new Date(c.date).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3">{c.author || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[300px]">
                          {c.message || '-'}
                        </td>
                      </tr>
                    ))
                : gitData?.tags
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((t) => (
                      <tr key={t.name} className="border-t hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <Link
                            to="/product/$org/$product"
                            params={{ org, product }}
                            search={{ stage: 'production', event: 'tag' }}
                            className="font-mono text-xs hover:text-primary"
                          >
                            {t.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.date ? new Date(t.date).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[300px]">
                          Tag: {t.name}
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface LastDeployCardProps {
  org: string
  product: string
  stage: 'staging' | 'production'
  title: string
  icon: React.ReactNode
  color: 'blue' | 'purple'
}

function LastDeployCard({ org, product, stage, title, icon, color }: LastDeployCardProps) {
  const fullProduct = `${org}/${product}`
  const { data: gitData, isLoading } = useGitRepoInfo({
    repo: fullProduct,
  })

  const commit = gitData?.commits[0]
  const tag = gitData?.tags[0]

  const version = stage === 'staging'
    ? commit?.hash.slice(0, 7)
    : tag?.name

  const author = commit?.author
  const date = stage === 'staging' ? commit?.date : tag?.date
  const message = commit?.message

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
  }

  const iconColors = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
  }

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={iconColors[color]}>{icon}</span>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando...
        </div>
      ) : version ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-medium">{version}</span>
            <span className="text-xs text-muted-foreground">
              {date && formatRelativeTime(date)}
            </span>
          </div>
          {message && (
            <p className="text-sm text-muted-foreground truncate">{message}</p>
          )}
          {author && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              {author}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin datos</p>
      )}
    </div>
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
