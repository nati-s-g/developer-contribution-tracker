# Architectural Decisions Record

This document records the foundational architectural decisions made throughout the development of the **Internship Contribution Tracker**, the alternatives considered, and the concrete engineering rationale for each choice. It is structured to serve as technical preparation for engineering design reviews and technical interviews.

---

## 1. Stack and Runtime Architecture

### Decision

Use **Next.js App Router (React 19, Server Components, Route Handlers)** with TypeScript and Tailwind CSS, keeping all logic in the root `app/` directory without a separate Node.js/Express backend.

### Alternatives Considered

- **Separate Express/Fastify Backend + React SPA (Vite)**: Would require deploying and orchestrating two distinct services, configuring cross-origin cookies (CORS/CSRF), and maintaining dual deployment pipelines.
- **Next.js Pages Router**: Legacy routing paradigm with higher client-bundle overhead and less granular server/client component boundaries.

### Why This Choice

- Unified full-stack deployment on Vercel with zero cold-start microservice overhead.
- Direct Server Components eliminate API serialization waterfalls; server-rendered tabs await cached GitHub calls directly.
- Hard security isolation: Server-only modules ensure secrets and tokens never cross into the browser bundle.

---

## 2. UI Philosophy: Classic IDE Style vs SaaS Dashboard

### Decision

Adopt a **classic VS Code / Antigravity developer-tool look**: dark theme only (`#1e1e1e`), dense 22–24px rows, flat borders, Cascadia Code monospace data typography, and zero decorative animations or gradients.

### Alternatives Considered

- **Modern SaaS Dashboard**: Large rounded cards, drop shadows, colorful gradient charts, hero banners, and purple/blue SaaS palettes.

### Why This Choice

- **Developer Affordance**: Developers reviewing technical work want high-density information, readable SHAs, monospace dates, and keyboard navigation, not promotional marketing flair.
- **Performance**: Zero web-font downloads (system font stack), flat DOM with minimal CSS transitions (<150ms color only), and lightweight Recharts.

---

## 3. Authentication: Stateless Encrypted Cookie vs Database-Backed Auth

### Decision

Implement GitHub OAuth via the standard **Authorization Code Flow** using **`iron-session`** (AES-256-GCM encrypted, HttpOnly, SameSite=Lax cookies). No database, no user tables, no persistence layer.

### Alternatives Considered

- **Better Auth / NextAuth / Auth.js**: Heavyweight abstraction layers with built-in database adapters. In stateless/JWT configurations, accessing the raw upstream GitHub provider access token for downstream API calls frequently creates token rotation bugs and cookie size overflow.
- **Supabase Auth / PostgreSQL**: Unnecessary infrastructure complexity for an MVP that requires no long-term persistence.

### Why This Choice

- **Minimal Surface Area**: The entire authentication layer is ~120 lines across two route handlers and a helper module.
- **Privacy & Security**: Tokens are sealed in an encrypted cookie that only the server can decrypt. When the session expires or the user signs out, the token is destroyed. Zero data is retained at rest.

---

## 4. State Management: The URL as the Single Source of Truth

### Decision

Store all application state (selected repository, date range, user time zone) strictly in **URL search parameters**: `?repo=owner/name&from=YYYY-MM-DD&to=YYYY-MM-DD&tz=Area/City`.

### Alternatives Considered

- **Client-Side State Stores (Redux, Zustand, React Context)**: State resets on page reload, cannot be bookmarked or shared, and requires client-side hydration before fetching data.

### Why This Choice

- **Shareability & Deep Linking**: An exact contribution period can be shared via URL or bookmarked directly.
- **Server Component Rendering**: Server Components can read `searchParams` on the initial request, fetching and rendering the dashboard without client-side loading waterfalls.
- **Zero Client Hydration Overhead**: Eliminates complex cache invalidation or synchronizing local state with router transitions.

---

## 5. GitHub API Integration: Thin Native Fetch Client vs Octokit / GraphQL

### Decision

Build a lightweight native `fetch` client in `lib/github/client.ts` with typed error classes (`GitHubRateLimitError`, `GitHubUnauthorizedError`, `GitHubNotFoundError`) and RFC 5988 `Link` header pagination.

### Alternatives Considered

- **Octokit SDK**: 500KB+ dependency package with dozens of transitive sub-packages, complex authentication plugins, and opinionated caching behaviors.
- **GitHub GraphQL API**: GitHub's GraphQL API does not index commits by author and date across repository forks, and calculates rate limits using complex cost multipliers rather than straightforward request counts.

### Why This Choice

- Native `fetch` integrates seamlessly with Next.js and React `cache()`.
- Explicit, transparent error handling with granular rate-limit header parsing (`x-ratelimit-remaining`, `x-ratelimit-reset`).
- Zero external dependency bloat.

---

## 6. Avoiding the N+1 API Problem: PR-Level Stats vs Per-Commit Diff Stats

### Decision

Extract line diff metrics (`+additions / -deletions`) exclusively from **Pull Requests**, refusing to call `GET /repos/{owner}/{repo}/commits/{sha}` per individual commit.

### Alternatives Considered

- **Per-Commit Diff Queries**: Calling commit detail endpoints for every commit authored by the user in the selected period.

### Why This Choice

- In active repositories with hundreds of commits, fetching commit diffs would exhaust the GitHub REST API rate limit (5,000 requests/hour) in a single user session (an N+1 network anti-pattern).
- Pull requests represent structured units of reviewed work where diff statistics are aggregated by GitHub in a single detail call.

---

## 7. Concurrency Control: Bounded Concurrency (`mapWithConcurrency`)

### Decision

Implement a custom bounded concurrency utility (`mapWithConcurrency(items, limit, fn)`, limit = 5) to batch detail requests (e.g. PR details and reviews) without third-party dependencies.

### Alternatives Considered

- **`Promise.all` (Unbounded Concurrency)**: Fires all asynchronous tasks at once, immediately triggering GitHub's secondary rate limiter (anti-abuse concurrent connection limits).
- **Sequential Loops (`for ... await`)**: Safe from rate limits but introduces unacceptable latency (e.g. 50 requests taking 25+ seconds).

### Why This Choice

- Enforces a strict ceiling of 5 concurrent HTTP connections while maintaining original array ordering and handling errors cleanly.

---

## 8. Data Resiliency: `Promise.allSettled` for Partial-Failure Tolerance

### Decision

Aggregate all four activity sources (commits, pull requests, issues, reviews) concurrently using **`Promise.allSettled`** inside `getRepositoryActivity`.

### Alternatives Considered

- **`Promise.all`**: If one source fails (e.g. the Search API rate limit is reached during PR review candidate search), the entire promise rejects and the user gets a blank error page.

### Why This Choice

- **Partial Degradation**: If reviews fail to load due to rate limiting, commits, pull requests, and issues still render immediately. The failure is recorded in `errors` and surfaced as an inline Problems banner with the exact reset time.

---

## 9. Review Attribution: Submitted Reviews vs Inline Comments

### Decision

Attribute reviews **strictly when a formal review is submitted** (`GET /repos/{owner}/{repo}/pulls/{number}/reviews`), ignoring line-level inline comments.

### Alternatives Considered

- **Counting Every Inline Comment**: Querying PR comments and counting every comment thread response as an individual contribution.

### Why This Choice

- Inline comments represent conversational remarks, whereas submitted reviews (`APPROVED`, `CHANGES_REQUESTED`, `COMMENTED`) represent formal code review milestones. Counting individual comments inflates contribution metrics deceptively.

---

## 10. Time Zone Day Attribution

### Decision

Bucket active days and timeline groups using **`Intl.DateTimeFormat("en-CA", { timeZone })`** based on the user's local IANA time zone (e.g. `Africa/Addis_Ababa`, `America/New_York`), defaulting to UTC.

### Alternatives Considered

- **Naive UTC Bucketing (`toISOString().slice(0, 10)`)**: Ignores the developer's real working day.

### Why This Choice

- A commit authored at 23:30 UTC belongs to the previous evening in UTC, but belongs to 02:30 AM the next morning in UTC+3. Local time conversion ensures that calendar active days and timeline headers match the developer's physical working schedule.
