import { User } from 'lucide-react'

import { cn } from '@/lib/utils'

type CommitAuthorProps = {
  name?: string | null
  className?: string
  maxChars?: number
}

export function CommitAuthor({
  name,
  className,
  maxChars = 25,
}: CommitAuthorProps) {
  return (
    <div className={cn('flex items-center gap-1 text-sm', className)}>
      <User className="w-4   h-4 shrink-0" />
      <span className="truncate" style={{ maxWidth: `${maxChars}ch` }}>
        {name ?? '—'}
      </span>
    </div>
  )
}
