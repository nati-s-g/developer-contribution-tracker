# Frontend Development Progress

## Step 4 Completed

### Completed:

- Built centralized server-only GitHub service layer in `lib/github/` (`client.ts`, `repositories.ts`, `index.ts`).
- Defined domain-level models (`RepositorySummary`, `RepositoryOwner`, `DateRange`, `AnalysisContext`) in `types/contributions.ts` and raw schemas in `types/github.ts`.
- Implemented interactive `RepositoryPicker` component with real-time search, private/public badges, star counters, keyboard navigation, and loading/empty/error states.
- Implemented `DateRangePicker` component with Start/End date inputs, presets (30d, 90d, 6m, YTD), format validation, end-before-start validation, and "Load activity" action.
- Wired sidebar state to URL query parameters (`?repo=owner/name&from=YYYY-MM-DD&to=YYYY-MM-DD&tz=Area/City`) adhering to the "URL is the state" architectural decision.
- Created `AnalysisContextCard` displaying active repository, visibility badge, analysis period duration in days, and time zone.
- Updated `StatusBar` to dynamically display the active repository, date range, time zone, and authenticated user.
- Created `GET /api/github/repositories` Route Handler for on-demand repository retrieval.
- Updated `docs/BUILD_LOG.md`.

### Architecture Decisions:

- **Centralized GitHub Service:** UI components never interact with the raw GitHub API directly. All requests pass through `lib/github/` with automatic token injection via `getGitHubToken()` and sanitized error handling.
- **URL as the State Engine:** No global state management library introduced. Selecting a repository or changing dates modifies URL search params, ensuring shareable, reloadable, and bookmarkable analysis scopes.
- **Server Component Data Flow:** Initial repository lists are fetched server-side in `layout.tsx` to eliminate client-side loading waterfalls, while `page.tsx` validates repository access and date ranges server-side.
- **Clean Separation of Raw and Domain Models:** Normalized `RepositorySummary` hides raw GitHub API response noise and prevents schema changes from leaking into UI components.

### Known Issues:

- GitHub organization restrictions may omit private repositories from organizations that haven't approved the OAuth App (expected GitHub security constraint).
- Rate limits on the GitHub REST API are bounded and surfaced with readable reset times.

### Next:

- Completed in Step 5 & 6.

## Step 5 Completed

### Completed:

- Added `lib/github/user.ts` (`getViewerLogin()`) to ensure viewer identity is locked to the authenticated user.
- Implemented bounded concurrency helper `lib/utils/concurrency.ts` (`mapWithConcurrency`).
- Created `lib/github/commits.ts` and `lib/github/pull-requests.ts` with pagination and Search API queries.
- Created `lib/contributions/get-activity.ts` with `Promise.allSettled` and partial failure tolerance.
- Built `OverviewActivity` with shadcn table and skeleton components, displaying commit/PR counts and latest tables.

## Step 6 Completed

### Completed:

- Implemented `lib/github/issues.ts` (Search API `is:issue author:{login}`) and `lib/github/reviews.ts` (Search API candidate PRs + reviews per PR, submitted reviews only).
- Extended `getRepositoryActivity` in `lib/contributions/get-activity.ts` to aggregate commits, pull requests, issues, and reviews concurrently with `Promise.allSettled`.
- Implemented pure processing functions:
  - `lib/contributions/categorize.ts`: Conventional Commit prefixes with scope & `!`, labels, word-boundary keywords, and `other` fallback.
  - `lib/contributions/summarize.ts`: Aggregates counts, additions/deletions, active days in user's IANA time zone, and category breakdown.
  - `lib/contributions/timeline.ts`: Chronological day grouping in local time zone, sorted newest first.
- Installed `vitest` and created comprehensive unit tests in `test/contributions.test.ts` (9 tests passing).
- Updated Overview tab with complete `ContributionSummary` table (with submitted reviews note, additions/deletions from PRs, active days) and "By category" breakdown.
- Built `TimelineActivity` with day group containers, 22–24px dense item rows, kind tags (`[commit]`, `[pr]`, `[issue]`, `[review]`), reference links, category badges, local time in `tz`, and inline Problems reporting.
- Wired `TimelinePanel` in `app/dashboard/page.tsx`.
- Formatted and verified with `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run format:check`.

## Step 7 Completed — MVP Done

### Completed:

- Built `PullRequestsTable` client component with sorting by number, title, state, date, diff changes, files, and category.
- Created `PullRequestsActivity` and `PullRequestsPanel` components with Suspense loading skeletons and informative empty states.
- Implemented pure chart processing in `lib/contributions/charts.ts` (`buildWeeklyActivity`, `buildCategoryChartData`) with unit tests in `test/contributions.test.ts`.
- Integrated two restrained charts on Overview tab using Recharts: weekly activity stacked by kind (starting Monday in `tz`), and contributions by category.
- Enhanced empty states with troubleshooting hints (date range, commit-email linking, default branch).
- Built `app/dashboard/error.tsx` error boundary supporting retry, session expiration prompt, and rate-limit messaging.
- Added GitHub API rate-limit info footer line on Overview.
- Performed complete security audit on source and built client bundles (`.next/static/`), verifying zero secret leaks.
- Rewrote `README.md` and created `docs/DECISIONS.md` documenting 10 architectural decisions.
- Formatted and verified with `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run format:check`.

### Status:

- All 7 steps of the MVP build plan are complete.
