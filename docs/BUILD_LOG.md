# Project Build Log

## Step 1 — Project Foundation & Architecture

### What changed

- Initialized Git repository.
- Scaffolded Next.js App Router with TypeScript, Tailwind CSS v4, and ESLint in the project root.
- Installed core dependencies:
  - `lucide-react` (icons)
  - `recharts` (charts for future contribution visualization)
  - `@supabase/supabase-js` and `@supabase/ssr` (backend persistence when required)
  - `clsx`, `tailwind-merge`, `class-variance-authority` (shadcn/ui foundation)
  - `shadcn` CLI and initialized `components.json`
  - `server-only` (for server-side GitHub and token boundaries)
  - Dev dependencies: `prettier`, `prettier-plugin-tailwindcss`
- Established project directory structure:
  - `app/` (root App Router layout, globals.css, and clean starter page)
  - `components/ui/` (shadcn button component)
  - `lib/` (`utils.ts`, `github/client.ts`, `supabase/client.ts`)
  - `types/` (`index.ts` with date range and contribution count placeholders)
  - `docs/` (`BUILD_LOG.md`)
- Prepared environment variable configuration:
  - Created `.env.example` with documented keys for GitHub OAuth, Supabase, and App URL.
  - Updated `.gitignore` to protect `.env*` files while allowing `.env.example`.
- Configured code quality scripts in `package.json`:
  - `npm run lint` (ESLint)
  - `npm run typecheck` (`tsc --noEmit`)
  - `npm run format` and `npm run format:check` (Prettier with Tailwind plugin)
  - Configured `.prettierrc`.

### Decisions and why

- **Root `app/` structure**: Kept `app/`, `components/`, and `lib/` at the root (no `src/` wrapper) to match the agreed architectural guidelines.
- **Prettier configured locally**: Ensures formatting consistency across environments without relying on machine-global binaries.
- **Server-only protection**: Added `server-only` package to guarantee that future GitHub tokens and API clients are strictly prevented from leaking into client-side bundles.
- **Deferred features**: No OAuth, dashboard, or live GitHub APIs were implemented yet, maintaining MVP simplicity and strict step progression.

### Known limitations

- Supabase persistence is deferred until required by future features.
- GitHub OAuth credentials are not yet configured (planned for Step 3).

### Open questions

- None at this stage. Foundation is verified and ready for Step 2.

## Step 2 — Design System and IDE-Style Shell

### What changed

- Configured design system and dark theme tokens matching VS Code Dark+ in `app/globals.css`:
  - Backgrounds: `--bg-editor` (#1e1e1e), `--bg-sidebar` (#252526), `--bg-titlebar` (#3c3c3c), `--bg-tab` (#2d2d2d), `--bg-status` (#007acc)
  - Borders and text: `--border` (#3c3c3c), `--fg` (#cccccc), `--fg-muted` (#9d9d9d), `--fg-strong` (#ffffff)
  - Interactions: `--accent` (#0078d4), `--link` (#3794ff), `--hover` (#2a2d2e), `--selected` (#094771), `--focus` (#007fd4)
  - Semantics: `--added` (#89d185), `--removed` (#f14c4c), `--warning` (#cca700), `--merged` (#c586c0), `--open` (#4ec9b0), `--closed` (#f14c4c)
  - Mapped shadcn variables to match the IDE tokens.
  - Set system font stacks (no font downloads) and base font size to 13px.
  - Added `class="dark"` to `<html>` in `app/layout.tsx` and wrapped with `TooltipProvider`.
- Added required shadcn/ui components: `button`, `tabs`, `scroll-area`, `resizable`, `separator`, `tooltip`, `sheet`.
- Created project skill `.agents/skills/classic-ide-ui/SKILL.md` enforcing IDE design rules.
- Built shell components in `components/shell/`:
  - `TitleBar`: App name, GitHub user status, sign out button, and mobile menu button.
  - `Sidebar` & `SidebarSection`: Collapsible sections for REPOSITORY (disabled select) and DATE RANGE (disabled From/To and Load activity button).
  - `EditorTabs`: Client-side tab coordinator built on shadcn Tabs accepting server-rendered panel nodes (`Overview`, `Timeline`, `Pull Requests`) with 1px top accent line on active tab and horizontal scroll on narrow screens.
  - `StatusBar`: 22px text-only status bar displaying repository, date range, timezone, and user state.
  - `DashboardShell`: Coordinates desktop resizable layout with mobile Sheet overlay below 768px (`md`).
- Implemented `/` Welcome page styled as an editor Welcome tab with app name, description, disabled GitHub login button, and dashboard preview link.
- Implemented `/dashboard` page and layout with static placeholder panels for density verification.

### Decisions and why

- **Client tabs with server content**: `EditorTabs` is a client component for tab switching without page reloads, while accepting `ReactNode` content so that future data panels remain server-rendered.
- **Responsive drawer via Sheet**: Below 768px, the sidebar is placed in a shadcn Sheet triggered by the TitleBar menu button, keeping the full width for tabular editor data while retaining access to filters.
- **Native system fonts**: Uses Segoe UI / Cascadia Code system stacks without font downloads to ensure fast startup, zero font layout shift, and authentic desktop IDE feel.
- **Self-contained static placeholders**: Placed density placeholder rows directly in `app/dashboard/page.tsx` for easy clean-up in future steps.

### Known limitations

- Playwright automated browser runner could not download driver binaries in this environment (external CDN 404), so responsive verification was done via dev server HTTP verification and DOM review.
- Controls are static placeholders; no real GitHub API or OAuth integration (Step 3).

### Open questions

- None. Ready for Step 3 (GitHub OAuth).

## Step 3 — GitHub OAuth Sign-In

### What changed

- Implemented Option B authentication architecture:
  - Standard OAuth 2.0 Authorization Code Flow.
  - Encrypted, stateless `httpOnly`, `sameSite: "lax"`, `secure` session cookie via `iron-session` (AES-256-GCM).
  - No database, no Supabase auth, and no persistent account tables in accordance with MVP constraints.
- Installed `iron-session` dependency for cookie sealing.
- Created `lib/auth/`:
  - `config.ts`: OAuth scope definitions, env validation with actionable error messages, and session options.
  - `session.ts`: `getSession()`, `requireAuth()`, `requireSession()`, `saveSession()`, `clearSession()`, and `getGitHubToken()`.
  - `index.ts`: Central barrel exports for auth helpers, typed with `import "server-only"`.
- Created Route Handlers:
  - `GET /api/auth/github`: Generates cryptographically secure `state`, sets temporary `httpOnly` state cookie, and redirects to GitHub authorize screen.
  - `GET /api/auth/callback/github`: Validates `state` against CSRF, handles user cancellations/errors gracefully, exchanges `code` for `access_token` server-side, fetches user profile (`id`, `login`, `avatar_url`), seals encrypted session cookie, and redirects to `/dashboard`.
  - `POST /api/auth/logout`: Clears session cookie and redirects to `/` with HTTP 303.
- Protected `/dashboard`:
  - `app/dashboard/layout.tsx` enforces `requireAuth()` server-side; redirects unauthenticated visitors to `/` before layout or page render.
  - Passes authenticated login name to `DashboardShell`, displaying `@login` in `TitleBar` and `StatusBar`.
- Updated UI:
  - `app/page.tsx` (Welcome page): "Sign in with GitHub" button connects to `/api/auth/github`. Removed temporary "Preview dashboard" link. Shows authenticated state when already signed in and handles error banners for OAuth callbacks.
  - `TitleBar`: Functional sign-out form when authenticated.
- Updated `.env.example` with exact callback URL and instructions.

### Decisions and why

- **Option B (iron-session sealed cookies) over Better Auth**: Better Auth stateless mode has known issues with provider token access in database-less configurations (e.g. `getAccessToken` returning "Account Not Found" and cookie size limits). Hand-crafted Authorization Code flow using `iron-session` is minimal (~120 lines total), 100% server-only, eliminates database dependencies, and keeps tokens strictly in backend memory and encrypted cookies.
- **Scope Trade-off**: Documented constant `GITHUB_OAUTH_SCOPES = ["read:user", "repo"]`. GitHub OAuth Apps lack a granular "read-only private repo" scope; reading private commits/PRs requires `repo`. Trimmed all unnecessary scopes (e.g. `user:email`).
- **Strict Server-Only Boundary**: All files in `lib/auth/` and route handlers enforce `import "server-only"`. `getGitHubToken()` is never exported or callable from client code.
- **Fails fast on missing env vars**: `/api/auth/github` returns a clear 500 error stating which specific variable is missing from `.env.local`.

### Known limitations

- **Organization Restrictions**: Organizations with third-party application restrictions enabled will hide their private repositories from API responses until an organization administrator explicitly approves the OAuth App.
- Requires valid `.env.local` credentials to execute live end-to-end OAuth consent on GitHub.

### Open questions

- None. Architecture is verified and ready for Step 4.

## Step 4 — GitHub Client, Repository Picker, Date Range

### What changed

- **GitHub Service Foundation (`lib/github/client.ts`)**:
  - Thin, server-only `fetch` wrapper communicating with `https://api.github.com`.
  - Automatically injects the user's token via `getGitHubToken()`.
  - Headers: `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, `User-Agent`, `cache: "no-store"`.
  - Structured typed errors: `GitHubUnauthorizedError` (401), `GitHubRateLimitError` (403/429 with parsed reset timestamp from `x-ratelimit-reset` / `retry-after`), `GitHubNotFoundError` (404), and `GitHubApiError`.
  - RFC 5988 `Link` header pagination helper (`githubFetchPaginated`) following `rel="next"` with a 3-page guard.
  - Telemetry: Returns latest GitHub rate-limit numbers (`limit`, `remaining`, `reset`, `used`) alongside results in `GitHubResponse<T>`.
- **Domain & Raw Types**:
  - `types/github.ts`: Raw types for only the fields used (`GitHubRawRepository`, `GitHubRawOwner`, `GitHubRateLimitInfo`).
  - `types/contributions.ts`: Normalized `RepositorySummary` (id, owner, name, fullName, private, pushedAt, description, defaultBranch, url).
- **Repository Operations (`lib/github/repositories.ts`)**:
  - `listRepositories()`: Fetches accessible repos via `GET /user/repos` with affiliations (`owner,collaborator,organization_member`), sorted by most recently pushed first, 100/page, capped at 3 pages (300 repos max).
  - `getRepository(owner, repo)`: Validates repository access with `GET /repos/{owner}/{repo}` using the user's token. Returns `null` on 404 / access denied.
- **Search Parameter Validation (`lib/utils/search-params.ts`)**:
  - Added `zod` for robust query parameter parsing and validation.
  - Validates `repo` (`owner/name` regex), `from` & `to` (`YYYY-MM-DD`, `from <= to`, not in future, duration <= 366 days), and `tz` (validated against IANA timezones via `Intl.DateTimeFormat`, defaulting to `UTC`).
  - Friendly error reporting: Produces descriptive error messages for invalid input without crashing.
- **IDE-Style Sidebar Controls**:
  - REPOSITORY section: Searchable picker built with shadcn `command` (`cmdk`) + `popover` (`@base-ui/react/popover`). Displays `owner/name`, lock icon for private repos, and real-time filtering as you type. Fetched server-side in `app/dashboard/layout.tsx` and passed as props.
  - DATE RANGE section: Native `<input type="date">` fields styled with IDE tokens via shadcn `input`, preset buttons (_Last 30 days_, _Last 90 days_, _This year_), and "Load activity" button.
  - Nothing loads while typing or selecting; clicking "Load activity" writes `?repo=…&from=…&to=…&tz=…` to the URL, taking the time zone from `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- **Dashboard Overview & Status Bar**:
  - `/dashboard` parses validated parameters and verifies repository access before accepting the selection.
  - Unselected state: Displays plain muted empty state: `"Select a repository and date range, then Load activity"`.
  - Selected state: Displays plain text `repo`, `range`, and `time zone` in the editor tab. All Step 2 placeholder rows and mock counters were removed.
  - Invalid state: Displays clear, friendly error messages when inputs or permissions fail.
  - Status bar: Displays real repository name, date range (`YYYY-MM-DD → YYYY-MM-DD`), time zone, and authenticated user.

### Decisions and why

- **URL as the Single Source of Truth**: All analysis filters reside in `?repo=…&from=…&to=…&tz=…`. This eliminates client-side global state, makes dashboard views linkable, supports browser history/refresh, and ensures consistent server rendering.
- **Server-Side Validation**: While browser inputs constrain formatting, server-side validation using Zod ensures security and resiliency against directly edited or malformed URLs.
- **RFC 5988 `Link` Pagination**: Traverses multi-page REST collections via GitHub's standard `Link` header rather than assumed numeric page increments.
- **Separation of Layers**: UI components consume normalized `RepositorySummary` domain types. Raw GitHub API details and tokens are confined strictly to `lib/github/` behind `server-only`.

### Known limitations

- Only repository metadata and access scope are retrieved in this step. Commits, pull requests, issues, and reviews are intentionally not fetched yet (deferred to Steps 5 & 6).
- Capped at 300 repositories per user in the repository picker.

### Open questions

- None. Step 4 is fully verified and ready for Step 5 (Commits and Pull Requests).

## Step 5 — Commits and Pull Requests Data Engine

### What changed

- **Viewer Identity (`lib/github/user.ts`)**:
  - `getViewerLogin()` calls `GET /user` to reliably determine the authenticated user's login.
  - Guarantees "My contributions" always resolves to the authenticated user and rejects client-supplied login overrides.
- **Bounded Concurrency Helper (`lib/utils/concurrency.ts`)**:
  - Implemented `mapWithConcurrency(items, limit, fn)` without external dependencies.
  - Enforces a concurrency ceiling while preserving original array order.
- **Normalized Domain & Raw Types**:
  - `types/contributions.ts`: Added `CommitItem`, `PullRequestSummary`, `PullRequestState`, `ActivitySourceError`, and `RepositoryActivity`.
  - `types/github.ts`: Added `GitHubRawCommit`, `GitHubSearchIssueItem`, `GitHubSearchResult`, and `GitHubRawPullRequest`.
- **Commits Retrieval (`lib/github/commits.ts`)**:
  - `getCommits(owner, repo, author, from, to)` queries `GET /repos/{owner}/{repo}/commits` with `author`, `since` (from 00:00:00Z), and `until` (to 23:59:59Z).
  - Paginates via `Link` header with a 10-page (1,000 commit) guard.
  - Maps to `CommitItem` (sha, shortSha, first line of commit message, authoredAt, url).
  - Explicitly avoided per-commit diff stats to eliminate N+1 network requests.
- **Pull Requests Retrieval (`lib/github/pull-requests.ts`)**:
  - Queries GitHub Search API (`GET /search/issues`) with two parallel queries:
    - `repo:{owner}/{repo} is:pr author:{login} created:{from}..{to}`
    - `repo:{owner}/{repo} is:pr author:{login} merged:{from}..{to}`
  - Deduplicates and unions results by PR number.
  - Detects and surfaces warnings if either query encounters GitHub's 1,000-result cap.
  - Fetches PR details (`GET /repos/{owner}/{repo}/pulls/{number}`) using `mapWithConcurrency(prNumbers, 5)` to extract draft, merged, mergedAt, additions, deletions, changedFiles, excerpt (first ~300 chars), and url.
- **Activity Aggregation & Resiliency (`lib/contributions/get-activity.ts`)**:
  - `getRepositoryActivity(owner, repo, login, from, to)` wrapped in React `cache()`.
  - Runs commits and PR fetchers concurrently with `Promise.allSettled`.
  - Graceful degradation: If one source encounters an error (e.g. Search API rate limit), the surviving source still renders and the error is recorded in `errors` with the source name and reset time.
- **Overview UI Components (`components/dashboard/`)**:
  - Added shadcn `table` and `skeleton` primitives styled to match `classic-ide-ui` tokens.
  - `OverviewActivity`: Displays three plain summary count rows (Commits, Pull requests, Merged pull requests) in dense table style, followed by dense tables for Latest Commits and Latest Pull Requests.
  - Displays inline "Problems" notice for any source failures or search cap warnings.
  - `OverviewPanel`: Combines plain text scope header with `<React.Suspense fallback={<OverviewActivitySkeleton />}>`.
- **Cross-Check & Data Validation**:
  - Tested concurrency bounds and partial failure resiliency.

### Decisions and why

- **Search API for PRs**: Standard `/repos/{owner}/{repo}/pulls` lacks author and date range filters, which would require scanning every PR in the repository. Search API provides indexed author/date queries.
- **Two Search Queries**: A PR created before the date window may have been merged during the window. Running both `created` and `merged` ensures complete attribution without missing merged contributions.
- **No Per-Commit Diff Stats**: Fetching additions and deletions per commit would require an extra API call per commit (N+1). Pull requests already provide diff stats for code reviews at a fraction of the API budget.
- **Concurrency Limit (5)**: Bounds parallel PR detail requests to prevent triggering GitHub's secondary rate limits while maintaining fast load times.
- **React `cache()` with Primitive Arguments**: Allows multiple Server Components and panels across the dashboard to await the exact same activity data without duplicate requests.

### Known limitations

- **Commit Email Association**: Commits authored under git emails not linked to the user's GitHub account are not recognized by GitHub's `author` filter.
- **Default Branch Only**: The GitHub commits list endpoint searches commits reachable from the default branch.
- **Search API Cap**: GitHub Search API results are capped at 1,000 results per query.
- Issues, reviews, and chronological timeline are deferred to Step 6.

### Open questions

- None. Ready for Step 6 (Issues, Reviews, Processing, Timeline).

## Step 6 — Issues, Reviews, Processing, Timeline

### What changed

- **Data Retrieval (Issues & Reviews)**:
  - `lib/github/issues.ts`: Implemented `getIssues(owner, repo, author, from, to)` querying GitHub Search API (`repo:{owner}/{repo} is:issue author:{login} created:{from}..{to}`). Maps to `IssueItem` (number, title, state, createdAt, closedAt, labels, url).
  - `lib/github/reviews.ts`: Implemented `getReviews(owner, repo, login, from, to)`. Finds candidate PRs via `is:pr reviewed-by:{login} repo:{owner}/{repo} updated:>={from} -author:{login}` (capped at 100 with warning). Fetches reviews per PR with `mapWithConcurrency(candidatePrs, 5)` using `GET /repos/{owner}/{repo}/pulls/{number}/reviews`. Keeps only reviews submitted by the user within the date range. Discards inline comments; counts submitted reviews only.
  - Exported `getIssues` and `getReviews` in `lib/github/index.ts`.
- **Activity Aggregation Extension (`lib/contributions/get-activity.ts`)**:
  - Extended `getRepositoryActivity` to fetch commits, pull requests, issues, and reviews concurrently using `Promise.allSettled`.
  - Preserves full partial failure resilience: if any individual source fails or is rate-limited, remaining sources render and failures are reported in `errors`.
- **Domain Models & Discriminated Unions (`types/contributions.ts`)**:
  - Defined `IssueItem`, `ReviewItem`, `ContributionCategory`, `DayTimelineGroup`, and `ContributionSummary`.
  - Defined `ActivityItem` as a discriminated union on `kind: "commit" | "pull_request" | "issue" | "review"`.
- **Pure Processing Layer (`lib/contributions/`)**:
  - `categorize.ts`: Pure `categorizeContribution(title, labels)` function evaluating:
    1. Conventional Commit prefixes (`feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `style`, `ci`, `build`) with optional scope and `!` breaking change indicator (e.g. `feat(auth)!: ...`).
    2. GitHub issue/PR labels (`bug`, `enhancement`, `documentation`, etc.).
    3. Title keywords with strict word boundaries (`\b(fix|bug|implement|feature|test|doc)\b`).
    4. Fallback to `other`.
  - `summarize.ts`: Pure `summarizeContributions(activity, timeZone)` computing total counts, merged PRs, active calendar days in `tz`, additions/deletions from PRs, first/last activity timestamps, and category breakdowns. Includes `getLocalDateString(isoDate, timeZone)` helper using `Intl.DateTimeFormat`.
  - `timeline.ts`: Pure `buildTimeline(activity, timeZone)` grouping all activity items by local date in target timezone, sorted chronologically descending (newest first).
- **Unit Test Suite (`test/contributions.test.ts`)**:
  - Added `vitest` unit test suite covering:
    - Conventional Commit prefixes with scope and `!`.
    - Standard prefixes without scope.
    - GitHub label priorities over generic titles.
    - Word boundary fallbacks on titles.
    - Unclassifiable items falling back to `other`.
    - Empty range handling (zero counts, null timestamps).
    - Local timezone day shifting (e.g. `23:30Z` on June 4th correctly shifts to `June 5th` in `Africa/Addis_Ababa` [UTC+3]).
    - Active days and category aggregation across mixed sources.
    - Chronological timeline grouping and sorting.
- **UI Updates (`components/dashboard/`)**:
  - `OverviewActivity`: Updated to render complete `ContributionSummary` rows (Commits, Pull requests, Merged PRs, Issues, Reviews with "submitted reviews only" footnote, Active days in `tz`, Code changes `+additions / -deletions`) and a "By category" table.
  - `TimelineActivity`: Rendered day group containers with sticky-style headers, 22–24px dense item rows, hover highlights, local time in `tz`, kind badges (`[commit]`, `[pr]`, `[issue]`, `[review]`), reference links (`#number` / short SHA), truncated titles, category tags, problems notice, and loading skeleton.
  - `TimelinePanel`: Created wrapper component with scope header and `React.Suspense` fallback.
  - `app/dashboard/page.tsx`: Replaced placeholder timeline with real `TimelinePanel`.

### Decisions and why

- **Pure Processing Functions Separated from I/O**: `categorize.ts`, `summarize.ts`, and `timeline.ts` are pure functions with zero network or server dependencies. This ensures deterministic behavior and enables blazing-fast unit testing without mocking network layers.
- **Submitted Reviews Only**: Inline PR comments are discussion remarks, not formal review milestones. Attributing each inline comment as a review contribution inflates metrics deceptively. Only reviews with `submitted_at` from `GET /repos/{owner}/{repo}/pulls/{number}/reviews` are counted, and this design choice is clearly stated in the UI.
- **Local Timezone Day Attribution**: Contributions occurring near midnight UTC often belong to a different calendar day in the developer's local timezone (e.g. UTC+3 shifts 23:30Z into the next morning). Converting timestamps to the local calendar day using `Intl.DateTimeFormat("en-CA", { timeZone })` guarantees active days and timeline headers match the developer's local working days.
- **Word Boundary Matching**: Keyword matching uses regex word boundaries (`\b`) to prevent false positives (e.g., words like "prefix" or "affix" matching "fix").

### Known limitations

- Candidate PRs for reviews are capped at 100 to prevent secondary rate limits when checking review details across large repositories. A warning is surfaced if candidate PRs reach this ceiling.
- Search API results are capped at 1,000 items by GitHub.

### Open questions

- None. Ready for Step 7 (Pull request tab, charts, hardening, deploy readiness).

## Step 7 — Pull Request Tab, Charts, Hardening, Docs, Deploy Readiness

### What changed

- **Pull Requests Tab (`components/dashboard/`)**:
  - `pull-requests-table.tsx`: Dense table with `#number`, title (links to GitHub), state (colored-dot tag for merged/open/closed), merged date, `+additions / -deletions`, changed files, and category tag. Summary line above table shows total count, merged count, and total additions/deletions. Added lightweight client-side sorting across all columns (toggle asc/desc).
  - `pull-requests-activity.tsx`: Async Server Component fetching PR activity with inline Problems notice and empty state hints.
  - `pull-requests-panel.tsx`: Panel wrapper with scope header and `PullRequestsActivitySkeleton`.
  - Wired into `app/dashboard/page.tsx` under the "Pull Requests" tab.
- **Two Restrained Charts (Recharts)**:
  - `lib/contributions/charts.ts`: Pure helpers `buildWeeklyActivity` and `buildCategoryChartData`. Weeks always start on Monday and are bucketed in the user's IANA `tz`.
  - Added unit test suite in `test/contributions.test.ts` verifying Monday alignment and timezone shift (11 tests passing total).
  - `components/dashboard/activity-charts.tsx`: Two charts rendered below stat rows:
    1. **Weekly Activity (Stacked by Kind)**: Commits (`--fg-muted`), PRs (`--link`), Issues (`--open`), Reviews (`--merged`). Monospace axes, subtle gridlines, no gradients, no animations.
    2. **Contributions by Category (Horizontal Bars)**: Deterministic classification counts in horizontal layout.
- **Robust States & Footer**:
  - Empty state with clear troubleshooting hints: check date range, verify local git email is linked to GitHub account (Settings → Emails), and note that commits analyze default branch.
  - Loading: Suspense skeletons matching IDE style across all tabs.
  - Error boundary: `app/dashboard/error.tsx` with retry (`reset()`), session expiration handling ("Sign in again"), rate-limit reset notifications, and not found / access denied handling.
  - GitHub API rate-limit info footer line on Overview: remaining/limit requests and local reset timestamp.
- **Security Audit**:
  - Inspected source code and built `.next/static/` client bundle: zero tokens or secrets exposed.
  - Verified all modules in `lib/github/` enforce `import "server-only";` on line 1.
  - Verified `SESSION_SECRET` is at least 32 characters and cookies use AES-256-GCM, HttpOnly, and SameSite=Lax.
  - Verified `.env.local` is in `.gitignore` and `.env.example` has names only.
  - Ran `npm audit`: 2 moderate vulnerabilities in devDependency (`vitest`), zero production runtime vulnerabilities. Documented per policy without `--force`.
- **Documentation**:
  - Completely rewrote `README.md` with layer diagram, setup instructions, scripts, security architecture, and limitations.
  - Created `docs/DECISIONS.md` containing 10 architectural decisions with alternatives and interview talking points.
  - Updated `FRONTEND_PROGRESS.md`.
- **Vercel Readiness**:
  - Validated that the application is fully stateless with no local filesystem or process memory dependencies.
  - Documented deployment steps and production GitHub OAuth App setup.

### Decisions and why

- **Client-Side Sorting on PRs**: Keeping sorting in the client component (`PullRequestsTable`) provides instant responsiveness without router transitions or re-fetching GitHub data.
- **Strictly Two Restrained Charts**: Two charts convey chronological velocity and domain focus without cluttering the screen. Additional charts (e.g. pie charts, heatmaps) would duplicate information already present in the tables and violate the classic IDE aesthetic.
- **No Animations on Charts**: Per the `classic-ide-ui` design system, `isAnimationActive={false}` prevents distracting visual effects and keeps the interface feeling like a professional developer tool.

### Known limitations

- Commits analysis evaluates the repository's default branch only.
- Unlinked git commit emails cannot be matched to GitHub user accounts.
- GitHub Search API enforces an upper ceiling of 1,000 items per query.

### Open questions

- None. The MVP pipeline is complete, hardened, and verified end-to-end.

## UI Refinement — Text Simplification & Layout Standardization

### What changed

- **Welcome Page Text Simplification (`app/page.tsx`)**:
  - Removed duplicate and marketing copy: eliminated the redundant developer vs reviewer cards, verbose feature bullet points, and multi-line architecture boxes that repeated summary counts.
  - Retained fundamental content only: Application name, concise single-sentence summary, primary GitHub sign-in button, compact 4-item scope badges (Commits, Pull requests, Reviews, Issues), and single-line security footnote.
  - Centered layout horizontally and vertically with standard developer IDE aesthetic.
- **Empty States Streamlining (`components/dashboard/`)**:
  - Simplified empty states across `OverviewPanel`, `TimelinePanel`, and `PullRequestsPanel` from verbose multi-sentence descriptions to a direct instruction: "Select a repository and date range, then click Load activity."
- **Dashboard Table & Chart De-duplication (`components/dashboard/`)**:
  - `OverviewActivity`: Removed duplicate parenthetical annotations `(submitted only)` from Reviews and `({timeZone})` from Active Days (timezone is already clearly indicated in the scope header).
  - `ActivityCharts`: Removed meta rationale disclaimer text and redundant classification subtitle.
- **Verification**:
  - `npm run format`: passed.
  - `npm run lint`: passed (0 errors, 0 warnings).
  - `npm run typecheck`: passed (0 errors).
  - `npm run test`: 11 unit tests passing.
  - `npm run build`: optimized production build succeeded without warnings.
