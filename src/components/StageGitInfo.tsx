import { Loader2, User, Calendar, Hash, FileCode, Plus, Minus } from 'lucide-react'
import type { CommitDetails } from '@/hooks/useCommit'

interface StageGitInfoProps {
  stage: 'staging' | 'production'
  commitDetails?: CommitDetails | null
  commitHash?: string
  tag?: {
    name: string
    date: string
  }
  isLoadingCommit?: boolean
}

export function StageGitInfo({ 
  stage, 
  commitDetails, 
  commitHash, 
  tag, 
  isLoadingCommit 
}: StageGitInfoProps) {
  const author = stage === 'staging' 
    ? commitDetails?.author 
    : commitDetails?.author
  const date = stage === 'staging' 
    ? commitDetails?.date 
    : tag?.date

  return (
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
              {commitDetails?.subject || '-'}
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
  )
}
