import { Link } from '@tanstack/react-router'

interface StageCommitsTableProps {
  stage: 'staging' | 'production'
  gitData?: {
    commits?: Array<{
      hash: string
      author: string
      date: string
      message: string
    }>
    tags?: Array<{
      name: string
      date: string
    }>
  }
  org: string
  product: string
}

export function StageCommitsTable({ stage, gitData, org, product }: StageCommitsTableProps) {
  return (
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
                  ?.slice()
                  .sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0
                    const dateB = b.date ? new Date(b.date).getTime() : 0
                    return dateB - dateA
                  })
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
                  ?.slice()
                  .sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0
                    const dateB = b.date ? new Date(b.date).getTime() : 0
                    return dateB - dateA
                  })
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
  )
}
