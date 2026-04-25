# Discoveries

## ETag Caching Issue in Seki API

**Problem**: Seki API was not returning data despite having a valid token.

**Root Cause**: The ETag caching mechanism in `seki.ts` was causing the API to return 304 Not Modified responses without data.

**Details**:
- The axios request interceptor in `seki.ts` saved ETags from responses to localStorage
- On subsequent requests, it sent the `If-None-Match` header with the cached ETag
- The Seki API responded with 304 Not Modified (no body) when the ETag matched
- This prevented the application from receiving fresh data

**Solution**: Temporarily disabled ETag caching by commenting out the section that adds the `If-None-Match` header in the request interceptor.

**File Modified**: `src/api/seki.ts` (lines 61-69)

**Related Changes**:
- Fix case-sensitive comparison in `checkSekiAccess` for Seki detection
- Fix Vite server to return 200 with `success: false` instead of 500 for command errors
- Update `exec.ts` client to handle `success` field

## Seki API Capabilities

Based on review of Seki BFF source code at `/Users/cenco/Github/seki/apps/bff/src/api`

### v1 Endpoints

#### Health (Public)
- `GET /health` - Health check endpoint
- `GET /ping` - Ping endpoint

#### Me (Authenticated)
- `GET /me` - Get user information
- `GET /me/organizations` - Get user organizations

#### Pipelines (Authenticated)
- `GET /products/:organization/:name/pipelines/:commit/:tag?` - Get pipeline by commit (and optional tag)
  - Returns `IPipeline | null`
  - Uses md5 hash of `commit|tag` as ID to query pipelinr service
  - With metadata and markdown enabled
- `GET /products/:organization/:name/pipelines` - List all pipelines with query params
  - Query params: `limit`, `offset`, `search`, `filters`, `sort`
  - Returns `ICollection<IPipeline>`
  - **Note**: Currently throws `PIPELINES_EXCEPTION` when querying

#### Repositories (Authenticated)
- `GET /repositories/:organization/:name/available` - Check if repository is available
- `POST /repositories/:organization/` - Create repository

#### Operations (Authenticated)
- `POST /operations/:organization/:environment/:product` - Execute operation in control plane
  - Body: `IOperation` with command_args
  - Product is automatically added to command_args

#### Secrets (Authenticated)
- `GET /secrets/:product/:environment?keys=` - Get secrets by product and environment
  - Optional `keys` query param to filter specific keys (comma-separated)
  - Organization resolved from user scopes
- `POST /secrets/:product/:environment/:key` - Set secret by product, environment, and key
  - Body: secret value
  - Metadata includes owner from user primarysid

### v2 Endpoints

#### Secrets (Authenticated)
- `GET /v2/secrets/:organization/:product/:environment?keys=` - Get secrets (organization explicit)
  - Organization is passed as parameter (lowercased)
  - Optional `keys` query param to filter specific keys
- `POST /v2/secrets/:organization/:product/:environment/:key` - Set secret (organization explicit)
  - Organization is passed as parameter (lowercased)
  - Body: secret value
  - Metadata includes owner from user primarysid

### Pipeline Data Structure

The pipeline data returned by Seki includes:
- `state`: IDLE, STARTED, SUCCESS, FAILED, WARN
- `events`: Array of pipeline events (VA, DR, BS, GD, BG, CI, TS, CD)
  - Each event has subevents with detailed step information
  - Events are sorted by order
- `git`: Git metadata (organization, product, commit, commit_message, commit_author, stage, event, ref)

### Known Issues

- `/products/:organization/:name/pipelines` endpoint throws `PIPELINES_EXCEPTION` when attempting to list pipelines
- This prevents using the list endpoint to verify if a product is compatible with Seki
