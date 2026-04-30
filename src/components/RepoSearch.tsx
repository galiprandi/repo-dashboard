import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Star, ExternalLink, Loader2, GitBranch } from 'lucide-react'
import { useUserRepos } from '@/hooks/useUserRepos'
import { useUserCollections } from '@/hooks/useUserCollections'
import { Link, useNavigate } from '@tanstack/react-router'

export function RepoSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isEditable, setIsEditable] = useState(false)
  const searchWidth = 'w-[35dvw]'
  const navigate = useNavigate()

  // Load all repos from user (via gh CLI) - no org specified to get all accessible repos
  const { data, isLoading } = useUserRepos()

  const { toggleFavorite, isFavorite } = useUserCollections()

  // Filter repos locally based on query
  const results = useMemo(() => {
    const allRepos = data?.results || []
    if (!query || query.length < 2) return allRepos.slice(0, 10) // Show first 10 when no query

    const lowerQuery = query.toLowerCase()
    return allRepos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(lowerQuery) ||
        repo.fullName.toLowerCase().includes(lowerQuery) ||
        (repo.description &&
          repo.description.toLowerCase().includes(lowerQuery))
    )
  }, [data?.results, query])

  const handleSelect = () => {
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleOpenInNewTab = (fullName: string) => {
    window.open(`https://github.com/${fullName}`, '_blank')
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut: Cmd/Ctrl + K to open and keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setIsOpen(true)
        inputRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setIsOpen(false)
        setSelectedIndex(-1)
      }

      if (isOpen && results.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        }
        if (event.key === 'Enter' && selectedIndex >= 0) {
          event.preventDefault()
          const repo = results[selectedIndex]
          if (repo) {
            const [org, name] = repo.fullName.split('/')
            navigate({
              to: '/product/$org/$product',
              params: { org, product: name },
              search: { stage: 'staging', event: 'commit' },
            })
            handleSelect()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, navigate])

  const hasResults = results.length > 0

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => {
            setIsEditable(true);
            if (query.length >= 2) setIsOpen(true);
          }}
          onBlur={() => setIsEditable(false)}
          placeholder={`Búsqueda en ${data?.results?.length || 0} repositorios... (Cmd+K)`}
          className={`${searchWidth} pl-10 pr-4 py-3 bg-muted/20 hover:bg-muted/40 border-none rounded-2xl text-sm focus:outline-none focus:ring-0 focus:bg-background transition-all shadow-none placeholder:text-muted-foreground/50`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          name="search-repos-not-credentials"
          readOnly={!isEditable}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 w-[500px] bg-background border border-border/50 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300`}>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-sm font-medium">Cargando repositorios...</p>
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-muted-foreground">
              <GitBranch className="w-5 h-5 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {query.length >= 2
                  ? 'Sin resultados coincidentes'
                  : 'Ingreso de texto para iniciar búsqueda'}
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((repo, index) => {
                const isFav = isFavorite(repo.fullName)
                const [org, name] = repo.fullName.split('/')
                const isSelected = index === selectedIndex

                return (
                  <div
                    key={repo.fullName}
                    className={`group px-6 py-4 border-none transition-all ${
                      isSelected ? 'bg-muted scale-[1.02]' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          to="/product/$org/$product"
                          params={{ org, product: name }}
                          search={{ stage: 'staging', event: 'commit' }}
                          onClick={() => handleSelect()}
                          className="block group-active:scale-[0.99] transition-transform"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'} transition-colors`}>
                              <GitBranch className="w-3.5 h-3.5" />
                            </div>
                            <span className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {repo.fullName}
                            </span>
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">
                              Actualizado {new Date(repo.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleFavorite(repo.fullName)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isFav
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50'
                          }`}
                          aria-label={
                            isFav
                              ? `Eliminar ${repo.fullName} de favoritos`
                              : `Agregar ${repo.fullName} a favoritos`
                          }
                          title={
                            isFav
                              ? 'Eliminar de favoritos'
                              : 'Agregar a favoritos'
                          }
                        >
                          <Star
                            className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => handleOpenInNewTab(repo.fullName)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          aria-label={`Abrir ${repo.fullName} en GitHub`}
                          title="Abrir en GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer hint */}
          <div className="px-3 py-2 bg-muted/30 border-t text-xs text-muted-foreground flex items-center justify-between">
            <span>{results.length} resultados encontrados</span>
            <span>Esc para cerrar</span>
          </div>
        </div>
      )}
    </div>
  )
}
