import { GitRefItem } from '@/components/GitRefItem'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useGitRepoInfo } from '@/hooks/useGitRepoInfo'
import { useFavorites } from '@/hooks/useFavorites'
import {
  GitCommit,
  Tag,
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

  const { data: gitData, isLoading, error } = useGitRepoInfo({
    repo: fullProduct,
  })

  // Get data based on stage
  const commit = gitData?.commits[0]
  const tag = gitData?.tags[0]

  const author = stage === 'staging' ? commit?.author : commit?.author
  const date = stage === 'staging' ? commit?.date : tag?.date
  const message = stage === 'staging' ? commit?.message : `Tag: ${tag?.name}`

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

  if (!commit && !tag) {
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
            hash={commit?.hash}
            name={tag?.name}
            message={commit?.message}
            author={commit?.author}
            date={stage === 'staging' ? commit?.date : tag?.date}
            org={org}
            repo={product}
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
      <div className="p-4 border rounded-lg space-y-2">
        <h3 className="font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Información de {stage === 'staging' ? 'commit' : 'tag'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Autor:</span>{' '}
            {author || 'Unknown'}
          </div>
          <div>
            <span className="text-muted-foreground">Fecha:</span>{' '}
            {date ? new Date(date).toLocaleString() : '-'}
          </div>
          <div className="md:col-span-2">
            <span className="text-muted-foreground">Mensaje:</span>
            <p className="mt-1 font-mono text-xs bg-muted p-2 rounded">
              {message || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Tags List (for production) or Commits List (for staging) */}
      <div className="p-4 border rounded-lg space-y-2">
        <h3 className="font-medium">
          {stage === 'staging' ? 'Commits recientes' : 'Tags disponibles'}
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {stage === 'staging'
            ? gitData?.commits.map((c) => (
                <GitRefItem
                  key={c.hash}
                  type="commit"
                  hash={c.hash}
                  message={c.message}
                  author={c.author}
                  date={c.date}
                  org={org}
                  repo={product}
                  showMessage
                  showAuthor
                  className="w-full"
                />
              ))
            : gitData?.tags.map((t) => (
                <GitRefItem
                  key={t.name}
                  type="tag"
                  name={t.name}
                  hash={t.commit}
                  date={t.date}
                  org={org}
                  repo={product}
                  showMessage={false}
                  showAuthor={false}
                  className="w-full"
                />
              ))}
        </div>
      </div>
    </div>
  )
}
