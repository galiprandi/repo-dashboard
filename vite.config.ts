import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
    {
      name: 'git-api',
      configureServer(server) {
        // Generic exec endpoint - only allows git commands
        server.middlewares.use('/api/exec', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', async () => {
            try {
              const { command } = JSON.parse(body)
              
              if (!command || typeof command !== 'string') {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'Missing command' }))
                return
              }

              // Security: Only allow commands that start with 'git '
              if (!command.trim().startsWith('git ')) {
                res.statusCode = 403
                res.end(JSON.stringify({ error: 'Only git commands are allowed' }))
                return
              }

              const { stdout, stderr } = await execAsync(command)
              
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ stdout, stderr }))
            } catch (error) {
              res.statusCode = 500
              res.end(JSON.stringify({ 
                error: error instanceof Error ? error.message : 'Command failed',
                stderr: error instanceof Error && 'stderr' in error ? (error as {stderr: string}).stderr : ''
              }))
            }
          })
        })

        // List all repos from user's accessible organizations via gh CLI
        server.middlewares.use('/api/repos/list', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          const org = req.url?.includes('?') 
            ? new URL(req.url || '', `http://localhost`).searchParams.get('org') || 'Cencosud-xlabs'
            : 'Cencosud-xlabs'

          try {
            // Check if gh is available and configured
            const { stdout: ghAuthStatus } = await execAsync('gh auth status 2>&1 || echo "not authenticated"')
            const isAuthenticated = !ghAuthStatus.includes('not authenticated') && !ghAuthStatus.includes('not logged')
            
            if (!isAuthenticated) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ results: [], error: 'gh not configured' }))
              return
            }

            // Get repos from specific organization
            const { stdout } = await execAsync(
              `gh repo list ${org} --limit 1000 --json name,description,pushedAt 2>/dev/null || echo "[]"`
            )
            
            const repos = JSON.parse(stdout) as Array<{ name: string; description: string; pushedAt: string }>
            const results = repos.map((repo) => ({
              fullName: `${org}/${repo.name}`,
              name: repo.name,
              description: repo.description || '',
              updatedAt: repo.pushedAt,
            }))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ results }))
          } catch (error) {
            // Graceful fallback: return empty array
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              results: [],
              error: error instanceof Error ? error.message : 'Failed to list repos'
            }))
          }
        })

        server.middlewares.use('/api/repos/search', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          const url = new URL(req.url || '', `http://localhost`)
          const query = url.searchParams.get('q')
          const org = url.searchParams.get('org') || 'Cencosud-xlabs'

          if (!query || query.length < 2) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Query must be at least 2 characters' }))
            return
          }

          try {
            // Use GitHub API REST directly (no gh CLI)
            const apiUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+org:${org}&per_page=100`
            const response = await fetch(apiUrl, {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'seki-web',
              }
            })
            
            if (!response.ok) {
              throw new Error(`GitHub API error: ${response.status}`)
            }
            
            const data = await response.json() as { items: Array<{ name: string; description: string; updated_at: string }> }
            const repos = data.items || []
            
            const results = repos.map((repo: { name: string; description: string; updated_at: string }) => ({
              fullName: `${org}/${repo.name}`,
              name: repo.name,
              description: repo.description || '',
              updatedAt: repo.updated_at,
            }))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ results }))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Search failed',
              results: []
            }))
          }
        })

        server.middlewares.use('/api/git', async (req, res) => {
          if (req.method !== 'GET') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }

          const url = new URL(req.url || '', `http://localhost`)
          const repo = url.searchParams.get('repo')

          if (!repo) {
            res.statusCode = 400
            res.end('Missing repo parameter')
            return
          }

          try {
            const repoUrl = `git@github.com:${repo}.git`
            
            // Get tags
            const { stdout: tagsOutput } = await execAsync(
              `git ls-remote --tags ${repoUrl} | grep -v "\\^{}$" | sort -V | tail -10`
            )

            const tags = []
            for (const tagLine of tagsOutput.trim().split('\n').filter(line => line)) {
              const [commit, tagRef] = tagLine.split('\t')
              const tagName = tagRef.replace('refs/tags/', '')
              
              let date = new Date().toISOString()
              try {
                const { stdout: tagDate } = await execAsync(
                  `git show -s --format=%ai ${commit}`
                )
                date = tagDate.trim()
              } catch {
                // Use default date
              }
              
              tags.push({ name: tagName, commit, date })
            }

            // Get commits (latest from main branch)
            const { stdout: headsOutput } = await execAsync(
              `git ls-remote --heads ${repoUrl} | grep "refs/heads/main"`
            )
            
            const commits = []
            if (headsOutput.trim()) {
              const mainCommit = headsOutput.trim().split('\t')[0]
              try {
                const { stdout: commitDetails } = await execAsync(
                  `git show -s --format="%H|%ai|%s|%an" ${mainCommit}`
                )
                const [hash, date, message, author] = commitDetails.trim().split('|')
                commits.push({ hash, date, message, author })
              } catch {
                commits.push({
                  hash: mainCommit,
                  date: new Date().toISOString(),
                  message: 'Unable to fetch commit details',
                  author: 'Unknown'
                })
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ commits, tags: tags.reverse() }))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Unknown error' 
            }))
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://seki-bff-api.cencosudx.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
