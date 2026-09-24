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

- Step 5 — GitHub Data Engine (Commits, Pull Requests, processing, and activity aggregation).
