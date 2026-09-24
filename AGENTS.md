# Internship Contribution Tracker — Project Rules

Always-on context for AI coding agents. It is deliberately short; the detailed instructions live in the step prompts. If this file and the repository disagree, inspect the repository, explain the difference, and do not blindly overwrite existing code.

## 1. What we are building

A web app that connects to a developer's GitHub account and turns their activity in one repository, over a chosen date range, into a clear contribution summary.

Core question it answers: "What did I actually contribute to this project during this period?"

Pipeline: GitHub sign-in → pick repository → pick date range → fetch activity → process and categorize → show summary.

Working name: Internship Contribution Tracker. Product concept: Developer Contribution Report Generator. Internships are the first use case, not the limit: users may be interns, employees, freelancers, students, or open-source contributors. Keep code, types and copy neutral ("contribution", "developer", "period"). The word "internship" appears only in the app-name constant.

## 2. MVP scope

In: GitHub OAuth; repository picker; date range; the signed-in user's commits, pull requests, issues and reviews; overview counts; chronological timeline; pull request summary; two simple charts.

Out (do not build unless asked): AI summaries, PDF/Markdown export, notifications, teams, billing, admin, a database, background jobs, GraphQL, microservices, analyzing other users, comparing repositories.

Later: V2 analytics (weekly/monthly summaries, heatmaps, trends). V3 reports (web, PDF, Markdown, CV). An AI layer that summarizes only retrieved data and never invents accomplishments.

## 3. Stack decisions (settled; do not revisit without a concrete reason)

- Next.js App Router, TypeScript (strict, no unnecessary `any`), Tailwind CSS. Root `app/` directory (no `src/`), import alias `@/*`.
- shadcn/ui, added one component at a time through its CLI. The source is copied into `components/ui/` and is ours to edit. Icons: lucide-react.
- Server Components and Route Handlers only. No Express, no separate backend.
- GitHub REST API through our own thin `fetch` client in `lib/github/`. No GraphQL, no Octokit.
- Auth: GitHub OAuth (OAuth App). The library is chosen in step 3.
- State: the URL is the state (`?repo=owner/name&from=YYYY-MM-DD&to=YYYY-MM-DD&tz=Area/City`). No global state library.
- Supabase: deferred. Nothing in the MVP needs persistence. Add it only when a feature requires it.
- Charts: Recharts, only where they help. Deploy: Vercel. Formatting: project-local Prettier. Package manager: npm.
- Dependencies stay local to the project. Never install project libraries globally.

## 4. Architecture rules

- Layers: UI components → contribution logic (`lib/contributions`) → GitHub service (`lib/github`) → GitHub REST API. UI never calls GitHub directly and never sees raw GitHub responses.
- Raw vs app data: raw GitHub types (`types/github.ts`, only the fields we use) are mapped into app models (`types/contributions.ts`): `RepositorySummary`, `CommitItem`, `PullRequestSummary`, `IssueItem`, `ReviewItem`, `ActivityItem`, `ContributionSummary`.
- Folders, created only when a step needs them: `app/`, `components/{shell,dashboard,ui}`, `lib/{auth,github,contributions,utils}`, `types/`, `docs/`.
- One module per GitHub resource (`repositories.ts`, `commits.ts`, `pull-requests.ts`, `issues.ts`, `reviews.ts`). No duplicated auth, fetch or pagination logic.
- Anything that touches tokens or GitHub is server-only (`import "server-only"`).
- Data is fetched with the signed-in user's own token, so GitHub itself enforces repository access. Never trust a client-supplied identity or repo name without validating it.
- Always paginate, bound concurrency, and handle rate limits (primary and Search API) with readable errors that include the reset time. One failing source must not blank the page: show what loaded and list what failed.
- Dashboard panels are server-rendered inside client-side tabs. Fetch activity once per request (React `cache()` with primitive arguments) so every panel can await the same result.
- Dates: API ranges include the whole end day. Day bucketing (active days, timeline groups, weekly charts) uses the user's IANA time zone from the `tz` param, default UTC.

## 5. Security rules

- Secrets only in `.env.local` (git-ignored). Keep `.env.example` with names and no values.
- Never expose the OAuth client secret, session secret or any GitHub token to the browser, logs, error messages or URLs. Nothing secret gets a `NEXT_PUBLIC_` prefix.
- Do not persist GitHub tokens beyond the session.
- Least privilege: OAuth scopes live in one documented constant.
- Do not rely on middleware/proxy alone for auth. Check the session in server code wherever data is read (`requireSession()`).
- Validate all user input (search params) on the server.
- Do not leak private repository information in error messages.
- Report `npm audit` findings; never run `--force` fixes.

## 6. UI direction

Classic, plain, developer-tool look in the style of VS Code / Antigravity: dark, dense, flat, monospace for data, easy to navigate. Not a modern SaaS dashboard.

Before ANY UI work (layout, component, styling, chart, copy), load and follow the `classic-ide-ui` skill (`.agents/skills/classic-ide-ui/SKILL.md`, created in step 2). No decorative charts, animations, gradients, glass effects or marketing copy.

## 7. Environment (Windows + PowerShell)

- Use PowerShell syntax. No bash-isms: no `rm -rf`, `export`, `cp -r`, heredocs, or `&&` chaining. Use separate commands or `;`, `Remove-Item`, `Copy-Item`, `$env:NAME`.
- Global `.ps1` wrappers do not run here. Use `prettier.cmd`, `vercel.cmd`, `pnpm.cmd` if a global tool is needed. Prefer `npm run <script>` (project-local tools). Do not change the PowerShell execution policy.
- `git` and `gh` work directly. Node, npm, Git, GitHub CLI, Vercel CLI, Prettier and Python are installed; check versions before relying on newer features.

## 8. How the agent works

1. Inspect first: read the relevant files, patterns and dependencies before changing anything.
2. Do only the current step. Never start the next step or add features "while you're at it".
3. Make the smallest coherent change. Prefer simple, readable code over clever abstraction. Do not rewrite large areas when a small edit works.
4. Explain important decisions briefly while working. The developer must be able to explain this project in an interview, so say what each new file is for and why it is designed that way.
5. If a requirement is unclear and the choice is risky, ask one focused question. If the choice is low-risk, use the simplest reasonable default and note it.
6. Verify with what applies: `npm run typecheck`, `npm run lint`, `npm run build`, tests, and a real run. Report results exactly as they were. Never say something passed or works unless you ran it, and say what you could not check.
7. Do not commit or push unless asked; propose a commit message. Never put secrets in git.
8. At the end of each step, append a short entry to `docs/BUILD_LOG.md`: what changed, decisions and why, known limitations, open questions.
9. Finish with what changed, what was verified, and what is left. Then stop and wait for the next step.

## 9. Build plan

1. Foundation (assess the repo, Next.js, TypeScript, Tailwind, Prettier, tooling)
2. Design system and IDE-style shell (static)
3. GitHub OAuth
4. GitHub client, repository picker, date range
5. Commits and pull requests
6. Issues, reviews, processing, timeline
7. Pull request tab, charts, hardening, docs, deploy readiness

The current step comes from the prompt. Earlier decisions are recorded in `docs/BUILD_LOG.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
