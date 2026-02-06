import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { GitCommit, Tag, ExternalLink, Eye, MoreHorizontal, Copy, Check } from 'lucide-react'

export type GitRefType = 'commit' | 'tag'

export interface GitRefItemProps {
  type: GitRefType
  hash?: string
  name?: string
  message?: string
  author?: string
  date?: string
  org: string
  repo: string
  showMessage?: boolean
  showAuthor?: boolean
  className?: string
  navigateOnClick?: boolean
  stage?: 'staging' | 'production'
}

interface MenuOption {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

export function GitRefItem({
  type,
  hash,
  name,
  message,
  author,
  date,
  org,
  repo,
  showMessage = false,
  showAuthor = false,
  className = '',
  navigateOnClick = false,
  stage,
}: GitRefItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const displayValue = type === 'commit' ? hash?.slice(0, 7) : name
  const fullValue = type === 'commit' ? hash : name

  // Determine the stage based on type if not provided
  const itemStage = stage || (type === 'commit' ? 'staging' : 'production')
  const event = type === 'commit' ? 'commit' : 'tag'

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleViewOnline = () => {
    const url =
      type === 'commit'
        ? `https://github.com/${org}/${repo}/commit/${hash}`
        : `https://github.com/${org}/${repo}/releases/tag/${name}`
    window.open(url, '_blank')
    setIsMenuOpen(false)
  }

  const handleCopy = async () => {
    if (fullValue) {
      await navigator.clipboard.writeText(fullValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    setIsMenuOpen(false)
  }

  const handleViewDetails = () => {
    // Placeholder for future detail view (modal, drawer, etc.)
    console.log('View details:', { type, hash, name, message, author, date })
    setIsMenuOpen(false)
  }

  const menuOptions: MenuOption[] = [
    {
      id: 'view-online',
      label: 'Ver en GitHub',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: handleViewOnline,
    },
    {
      id: 'copy',
      label: copied ? 'Copiado!' : 'Copiar',
      icon: copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />,
      onClick: handleCopy,
      disabled: !fullValue,
    },
    {
      id: 'view-details',
      label: 'Ver detalles',
      icon: <Eye className="w-4 h-4" />,
      onClick: handleViewDetails,
    },
  ]

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {navigateOnClick ? (
        <Link
          to="/product/$org/$product"
          params={{ org, product: repo }}
          search={{ stage: itemStage, event }}
          className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors cursor-pointer group"
          title={`Ver detalle de ${displayValue || '-'}`}
        >
          {type === 'commit' ? (
            <GitCommit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          ) : (
            <Tag className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span className="font-mono text-sm">{displayValue || '-'}</span>
        </Link>
      ) : (
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors cursor-pointer group"
          title="Click para ver opciones"
        >
          {type === 'commit' ? (
            <GitCommit className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          ) : (
            <Tag className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span className="font-mono text-sm">{displayValue || '-'}</span>
          <MoreHorizontal className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}

      {showMessage && message && (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">{message}</span>
      )}

      {showAuthor && author && (
        <span className="text-xs text-muted-foreground">{author}</span>
      )}

      {/* Context Menu - only show when not in navigate mode */}
      {!navigateOnClick && isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-1 z-50 min-w-[160px] bg-white border rounded-md shadow-lg py-1 animate-in fade-in slide-in-from-top-1"
        >
          {menuOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.onClick}
              disabled={option.disabled}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Compact version for lists
export function GitRefItemCompact({
  type,
  hash,
  name,
  message,
  author,
  date,
  org,
  repo,
  className = '',
}: GitRefItemProps) {
  return (
    <div className={`flex items-center gap-2 p-2 bg-muted rounded text-sm group ${className}`}>
      {type === 'commit' ? (
        <GitCommit className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Tag className="w-4 h-4 text-muted-foreground" />
      )}

      <GitRefItem
        type={type}
        hash={hash}
        name={name}
        message={message}
        author={author}
        date={date}
        org={org}
        repo={repo}
        className="flex-1"
      />

      {message && (
        <span className="truncate flex-1 text-muted-foreground">{message}</span>
      )}

      {author && (
        <span className="text-muted-foreground text-xs">{author}</span>
      )}

      {date && (
        <span className="text-muted-foreground text-xs">
          {new Date(date).toLocaleDateString()}
        </span>
      )}
    </div>
  )
}

export default GitRefItem
