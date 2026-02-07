import { createFileRoute, Link } from '@tanstack/react-router'
import { useGitRepoInfo } from '@/hooks/useGitRepoInfo'
import { useCommit } from '@/hooks/useCommit'
import { useLatestPipeline } from '@/hooks/usePipelines'
import { ExternalLink, Clock, GitBranch } from 'lucide-react'
import { useState } from 'react'
import { StageGitInfo } from '@/components/StageGitInfo'
import { StageCommitsTable } from '@/components/StageCommitsTable'

export const Route = createFileRoute('/product/$org/$product/')({
  component: ProductIndex,
})

function ProductIndex() {
  const { org, product } = Route.useParams()
  const fullProduct = `${org}/${product}`
  const [activeStage, setActiveStage] = useState<'staging' | 'production'>('production')

  const { data: gitData } = useGitRepoInfo({
    repo: fullProduct,
  })

  const commitHash = activeStage === 'staging' ? gitData?.commits[0]?.hash : gitData?.tags[0]?.commit
  
  const { data: commitDetails, isLoading: isLoadingCommit } = useCommit({
    repo: fullProduct,
    commitHash,
    enabled: activeStage === 'staging' && !!commitHash,
  })

  const tag = gitData?.tags[0]

  return (
    <div>
      {/* Environment Selector - Pill Style */}
      <div className="flex bg-muted rounded-lg p-1 mb-10">
        <button
          onClick={() => setActiveStage('production')}
          className={`px-4 py-1.5 text-sm rounded-md transition-all ${
            activeStage === 'production'
              ? 'bg-white shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Production
        </button>
        <button
          onClick={() => setActiveStage('staging')}
          className={`px-4 py-1.5 text-sm rounded-md transition-all ${
            activeStage === 'staging'
              ? 'bg-white shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Staging
        </button>
      </div>

      {/* Current Deployment Card - Clean & Minimal */}
      <div className="mb-8">
        <h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
          Current Deployment
        </h2>
        <LastDeployCard
          org={org}
          product={product}
          stage={activeStage}
        />
      </div>

      {/* Git Info Section */}
      <div className="mb-8">
        <h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
          Deployment Details
        </h2>
        <StageGitInfo
          stage={activeStage}
          commitDetails={commitDetails}
          commitHash={commitHash}
          tag={tag}
          isLoadingCommit={isLoadingCommit}
        />
      </div>

      {/* History Section */}
      <div>
        <h2 className="text-sm text-muted-foreground mb-4 uppercase tracking-wider font-medium">
          {activeStage === 'staging' ? 'Recent Commits' : 'Recent Tags'}
        </h2>
        <StageCommitsTable
          stage={activeStage}
          gitData={gitData}
          org={org}
          product={product}
        />
      </div>
    </div>
  )
}

interface LastDeployCardProps {
  org: string
  product: string
  stage: 'staging' | 'production'
}

function LastDeployCard({ org, product, stage }: LastDeployCardProps) {
  const fullProduct = `${org}/${product}`
  
  // Get latest pipeline from Seki (source of truth for deployments)
  const { data: pipeline } = useLatestPipeline({
    product: fullProduct,
    stage,
  })

  // For staging: use commit hash from pipeline
  // For production: use tag name from pipeline
  const displayVersion = stage === 'staging'
    ? pipeline?.git?.commit?.slice(0, 7)
    : pipeline?.git?.ref

  const fullCommitHash = pipeline?.git?.commit
  const tagName = pipeline?.git?.ref
  const message = pipeline?.git?.commit_message
  const author = pipeline?.git?.commit_author
  const date = pipeline?.updated_at

  // Build navigation params
  const pipelineIdentifier = stage === 'staging' 
    ? { commit: fullCommitHash } 
    : { commit: fullCommitHash, tag: tagName }

  return (
    <Link
      to="/product/$org/$product/pipeline/$stage"
      params={{ org, product, stage }}
      search={pipelineIdentifier}
      className="group flex items-center justify-between p-5 bg-card border rounded-xl hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-5">
        {/* Status Indicator */}
        <div className={`w-2 h-12 rounded-full ${stage === 'production' ? 'bg-purple-500' : 'bg-blue-500'}`} />
        
        <div>
          {/* Version & Branch */}
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-lg font-medium">{displayVersion || '—'}</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              {stage}
            </span>
          </div>
          
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {message && (
              <span className="truncate max-w-md">{message}</span>
            )}
            {author && (
              <div className="flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5" />
                {author}
              </div>
            )}
            {date && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatRelativeTime(date)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action */}
      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
