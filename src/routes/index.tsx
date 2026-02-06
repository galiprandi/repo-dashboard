import { createFileRoute, Link } from '@tanstack/react-router'
import { useFavorites } from '@/hooks/useFavorites'
import { useGitRepoInfo } from '@/hooks/useGitRepoInfo'
import { useCommit } from '@/hooks/useCommit'
import {
  GitCommit,
  Loader2,
  Clock,
  User,
  Star,
  Tag,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { favorites, toggleFavorite } = useFavorites()

  const favoriteRepos = favorites
    .filter((f) => f.includes('/'))
    .map((f) => ({
      fullName: f,
      name: f.split('/')[1],
      description: '',
      updatedAt: '',
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Favoritos</h1>
      </div>

      {/* Favorites Table */}
      <section>
        <ReposTable
          repos={favoriteRepos}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      </section>
    </div>
  )
}

interface RepoInfo {
  fullName: string
  name: string
  description: string
  updatedAt: string
}

interface ReposTableProps {
  repos: RepoInfo[]
  favorites: string[]
  onToggleFavorite: (product: string) => void
}

function ReposTable({ repos, favorites, onToggleFavorite }: ReposTableProps) {
  if (repos.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay favoritos</p>
        <p className="text-sm">Agrega repositorios a favoritos desde el buscador</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium">Repositorio</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Tag</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Commit</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Actualizado</th>
            <th className="px-4 py-2 text-left text-sm font-medium">Autor</th>
            <th className="px-4 py-2 text-center text-sm font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => (
            <RepoRow
              key={repo.fullName}
              repo={repo}
              isFavorite={favorites.includes(repo.fullName)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface RepoRowProps {
  repo: RepoInfo
  isFavorite: boolean
  onToggleFavorite: (product: string) => void
}

function RepoRow({ repo, isFavorite, onToggleFavorite }: RepoRowProps) {
  const [org, name] = repo.fullName.split('/')

  const { data: gitData, isLoading: isLoadingGit } = useGitRepoInfo({
    repo: repo.fullName,
  })

  const latestCommit = gitData?.commits[0]
  const latestTag = gitData?.tags[0]

  // Use useCommit for detailed commit info
  const { data: commitDetails, isLoading: isLoadingCommit } = useCommit({
    repo: repo.fullName,
    commitHash: latestCommit?.hash,
    enabled: !!latestCommit?.hash,
  })

  const commitHash = latestCommit?.hash.slice(0, 7) || '-'
  const tagName = latestTag?.name || '-'
  const author = commitDetails?.author || latestCommit?.author || '-'
  const updatedAt = commitDetails?.date
    ? formatRelativeTime(commitDetails.date)
    : repo.updatedAt
    ? formatRelativeTime(repo.updatedAt)
    : '-'

  const isLoading = isLoadingGit || isLoadingCommit

  if (isLoading) {
    return (
      <tr className="border-t">
        <td className="px-4 py-3">
          <Link
            to="/product/$org/$product"
            params={{ org, product: name }}
            search={{ stage: 'staging', event: 'commit' }}
            className="font-medium hover:text-primary"
          >
            {repo.fullName}
          </Link>
        </td>
        <td colSpan={4} className="px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <button
            onClick={() => onToggleFavorite(repo.fullName)}
            className={`${isFavorite ? 'text-yellow-500' : 'text-muted-foreground'} hover:text-yellow-600`}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t hover:bg-muted/50">
      <td className="px-4 py-3">
        <Link
          to="/product/$org/$product"
          params={{ org, product: name }}
          search={{ stage: 'staging', event: 'commit' }}
          className="font-medium hover:text-primary"
        >
          {repo.fullName}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm font-mono">
          <Tag className="w-3 h-3 text-purple-500" />
          {tagName}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm font-mono">
          <GitCommit className="w-3 h-3 text-blue-500" />
          {commitHash}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {updatedAt}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {author}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleFavorite(repo.fullName)}
          className={`${isFavorite ? 'text-yellow-500' : 'text-muted-foreground'} hover:text-yellow-600`}
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </td>
    </tr>
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
