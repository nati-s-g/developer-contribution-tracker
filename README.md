# Internship Contribution Tracker

> **Developer Contribution Report Generator**
> Connect to your GitHub account and turn your actual repository activity over any chosen date range into a clear, verified contribution summary.

---

## What It Does

Internship Contribution Tracker answers the core question: **"What did I actually contribute to this project during this period?"**

Whether preparing for an internship exit review, updating a CV, compiling a contract report, or documenting open-source contributions, this tool provides a verifiable record of developer output:

- **Authentication**: Seamless GitHub OAuth sign-in with server-only token security.
- **Scope Selection**: Select any repository you have access to (public or private) and specify an exact date range.
- **Activity Retrieval**: Aggregates commits, pull requests, opened issues, and submitted code reviews in parallel.
- **Deterministic Processing**: Pure, deterministic classification of contributions into categories (`feature`, `bugfix`, `refactor`, `docs`, `test`, `chore`, `other`) using Conventional Commits and GitHub labels.
- **Classic IDE Interface**: Designed in the style of VS Code and Antigravity: dark, dense, flat, keyboard-friendly, and monospace for all technical data.

---

## Architecture

The application enforces a strict unidirectional four-layer architecture with a hard server-only security boundary:

```text
┌────────────────────────────────────────────────────────┐
│                     UI Components                      │
│   (OverviewPanel, TimelinePanel, PullRequestsPanel)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Contribution Processing Layer              │
│       (categorize.ts, summarize.ts, timeline.ts)       │
│    Pure deterministic functions with zero I/O or token │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Server-Only GitHub Data Service            │
│   (client.ts, commits.ts, pull-requests.ts, issues.ts) │
│       Guarded by "server-only", token never leaks      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                    GitHub REST API                     │
│    (/user, /repos, /commits, /search/issues, /reviews) │
└────────────────────────────────────────────────────────┘
```

### Key Principles

1. **The URL is the State**: All filter parameters live in `?repo=owner/name&from=YYYY-MM-DD&to=YYYY-MM-DD&tz=Area/City`. No global state library is used. Analyses are bookmarkable, shareable, and resilient to browser refreshes.
2. **React Cache Deduplication**: Data is fetched once per request via `getRepositoryActivity()` wrapped in React `cache()`. All three panels (`Overview`, `Timeline`, `Pull Requests`) await the same cached promise without redundant network calls.
3. **Client-Side Tab Switching**: Tab switching inside `EditorTabs` is client-side state. Navigating between tabs executes zero network requests.
4. **Resiliency and Partial-Failure Tolerance**: All four activity sources are fetched concurrently using `Promise.allSettled`. If one source encounters an error (such as a Search API rate limit), the surviving sources render normally and failures are reported in an inline Problems notice with reset times.

---

## Getting Started

### Prerequisites

- **Node.js**: v20.x or later (tested with v24.x)
- **npm**: v10.x or later

### 1. Create a GitHub OAuth App

1. Go to your GitHub account: **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. Configure the following fields:
   - **Application name**: `Internship Contribution Tracker (Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Click **Register application**.
4. Generate a new **Client secret**. Keep your Client ID and Client secret handy.

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (copied from `.env.example`):

```bash
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# GitHub OAuth Credentials
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Session Secret (at least 32 characters for AES-256-GCM cookie encryption)
# Generate with: openssl rand -base64 32
SESSION_SECRET=your_32_character_minimum_random_secret_here
```

### 3. Install Dependencies and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script                 | Command              | Description                                          |
| :--------------------- | :------------------- | :--------------------------------------------------- |
| `npm run dev`          | `next dev`           | Start development server on port 3000 with Turbopack |
| `npm run build`        | `next build`         | Create optimized production build                    |
| `npm run start`        | `next start`         | Run production server                                |
| `npm run test`         | `vitest run`         | Execute unit test suite                              |
| `npm run typecheck`    | `tsc --noEmit`       | Validate TypeScript types without emitting files     |
| `npm run lint`         | `eslint`             | Run ESLint checks                                    |
| `npm run format`       | `prettier --write .` | Format all code with Prettier                        |
| `npm run format:check` | `prettier --check .` | Verify formatting across the project                 |

---

## Security Architecture

- **Server-Only Isolation**: All modules touching GitHub tokens enforce `import "server-only"`. Tokens exist exclusively in server memory and encrypted cookies.
- **AES-256-GCM Cookie Encryption**: Sessions are sealed in HttpOnly, SameSite=Lax cookies using `iron-session`. Tokens are never exposed to JavaScript or client components.
- **Viewer Identity Locking**: User contributions are always locked to the signed-in user's identity resolved via `GET /user`. Client-supplied user parameter spoofing is impossible.
- **Input Validation**: All URL search parameters are validated server-side using Zod to prevent malformed queries or SSRF vectors.

---

## Known Limitations and Trade-offs

1. **OAuth `repo` Scope Trade-off**:
   GitHub OAuth Apps do not provide a granular "read-only private repositories" scope. Accessing private repository metadata, commits, and pull requests requires the broad `repo` scope. We deliberately minimize requested scopes to strictly `["read:user", "repo"]`.
2. **Organization Restrictions**:
   If a GitHub organization enforces third-party application restrictions, its private repositories will not be visible until an organization administrator explicitly approves the OAuth App.
3. **Commit Email Association**:
   Commits authored with git emails not verified on your GitHub account (Settings → Emails) cannot be associated with your user by the GitHub `author` filter.
4. **Default Branch Only**:
   The GitHub REST commits endpoint queries commits reachable from the repository's default branch.
5. **Search API Cap**:
   GitHub's Search API enforces an upper limit of 1,000 results per query. For PR reviews, candidate PRs are capped at 100 to protect rate limits.
6. **No Per-Commit Diff Stats**:
   Calculating additions and deletions for every commit would require an extra API call per commit (N+1). Code diff metrics are derived accurately from pull requests.
