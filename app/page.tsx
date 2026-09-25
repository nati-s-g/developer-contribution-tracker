import Link from "next/link";
import {
  Terminal,
  ArrowRight,
  AlertCircle,
  LogOut,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function getErrorMessage(errorKey: string | null): string | null {
  switch (errorKey) {
    case "cancelled":
      return "GitHub authorization was cancelled.";
    case "invalid_state":
      return "OAuth state validation failed. Please try signing in again.";
    case "missing_code":
      return "Authorization code missing from GitHub response.";
    case "exchange_failed":
      return "Failed to exchange authorization code for access token.";
    case "user_fetch_failed":
      return "Failed to fetch user profile from GitHub.";
    case "config_missing":
      return "Authentication configuration error. Check .env.local.";
    case "session_save_failed":
      return "Failed to create encrypted session cookie.";
    case "github_error":
      return "GitHub returned an authentication error.";
    default:
      return null;
  }
}

export default async function WelcomePage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const authError =
    typeof searchParams.auth_error === "string"
      ? searchParams.auth_error
      : null;
  const errorMessage = getErrorMessage(authError);
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-editor)] text-[var(--fg)]">
      {/* Top Title Bar */}
      <header className="flex h-[38px] min-h-[38px] w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg-titlebar)] px-4 text-xs select-none">
        <div className="flex items-center gap-2.5">
          <Terminal className="size-4 text-[var(--link)]" />
          <span className="font-semibold tracking-tight text-[var(--fg-strong)]">
            Internship Contribution Tracker
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)]">
            <span>github:</span>
            <span className="text-[var(--fg-strong)]">
              {session ? `@${session.user.login}` : "unsigned"}
            </span>
          </div>

          {session && (
            <form
              action="/api/auth/logout"
              method="POST"
              className="flex items-center"
            >
              <Button
                type="submit"
                variant="ghost"
                size="xs"
                aria-label="Sign out"
                className="h-6 cursor-pointer gap-1.5 rounded-[2px] px-2 text-xs text-[var(--fg-muted)] hover:bg-[var(--hover)] hover:text-[var(--fg-strong)]"
              >
                <LogOut className="size-3" />
                <span>Sign out</span>
              </Button>
            </form>
          )}
        </div>
      </header>

      {/* Editor Tab Bar */}
      <div className="flex h-[35px] min-h-[35px] border-b border-[var(--border)] bg-[var(--bg-editor)]">
        <div className="flex h-[35px] items-center gap-2 border-t border-r border-[var(--border)] border-t-[var(--accent)] bg-[var(--bg-editor)] px-4 text-xs font-medium text-[var(--fg-strong)]">
          <span>Welcome.md</span>
        </div>
      </div>

      {/* Centered Document Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-3xl space-y-8 text-center select-text">
          {/* Pre-title Tag */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-[2px] border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-1 font-mono text-xs font-medium tracking-wide text-[var(--link)]">
              <Terminal className="size-3.5" />
              <span>DEVELOPER CONTRIBUTION REPORT GENERATOR</span>
            </span>
          </div>

          {/* Heading and Subtitle */}
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg-strong)] md:text-4xl">
              Internship Contribution Tracker
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--fg-muted)] md:text-base">
              Connect your GitHub account to turn repository activity over any
              chosen date range into an objective, verified contribution summary
              across commits, pull requests, code reviews, and issues.
            </p>
          </div>

          {/* Error Banner if redirect from OAuth failure */}
          {errorMessage && (
            <div
              role="alert"
              className="mx-auto flex max-w-lg items-center gap-2.5 rounded-[2px] border border-[var(--removed)] bg-[var(--bg-sidebar)] p-3 text-left text-xs text-[var(--removed)]"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Action Button (Centered) */}
          <div className="flex flex-col items-center justify-center gap-3">
            {session ? (
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-[2px] border border-[var(--border)] bg-[var(--bg-sidebar)] px-3 py-1.5 font-mono text-xs text-[var(--fg)]">
                  <span className="size-2 rounded-full bg-[var(--open)]" />
                  <span>
                    Authenticated as{" "}
                    <strong className="text-[var(--fg-strong)]">
                      @{session.user.login}
                    </strong>
                  </span>
                </div>
                <div>
                  <Link
                    href="/dashboard"
                    className="inline-flex h-9 items-center gap-2 rounded-[2px] bg-[var(--accent)] px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent)]/90"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <a
                  href="/api/auth/github"
                  className="inline-flex h-10 items-center gap-2.5 rounded-[2px] bg-[var(--accent)] px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent)]/90"
                >
                  <GithubIcon className="size-4" />
                  <span>Sign in with GitHub</span>
                </a>
                <div className="font-mono text-xs text-[var(--fg-muted)]">
                  Stateless OAuth · Encrypted HttpOnly Session · No Database
                  Required
                </div>
              </div>
            )}
          </div>

          {/* Two Standard Perspectives: For Developers and For Reviewers */}
          <div className="grid grid-cols-1 gap-4 pt-2 text-left md:grid-cols-2">
            {/* For Developers Card */}
            <div className="space-y-3 rounded-[2px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold tracking-wider text-[var(--open)] uppercase">
                  [ For Developers ]
                </span>
                <span className="font-mono text-[11px] text-[var(--fg-muted)]">
                  Proof of Work
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg-strong)]">
                Verifiable Contribution Records
              </h3>
              <p className="text-xs leading-relaxed text-[var(--fg-muted)]">
                Compile actual, verified accomplishments for internship exit
                reviews, standup updates, promotion dossiers, or CV
                documentation without guesswork.
              </p>
              <ul className="space-y-1.5 pt-1 font-mono text-xs text-[var(--fg-muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-[var(--open)]" />
                  <span>Conventional Commit categorization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-[var(--open)]" />
                  <span>Active days in your local timezone</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-[var(--open)]" />
                  <span>Accurate PR code changes (+/- diff)</span>
                </li>
              </ul>
            </div>

            {/* For Reviewers Card */}
            <div className="space-y-3 rounded-[2px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold tracking-wider text-[var(--link)] uppercase">
                  [ For Reviewers ]
                </span>
                <span className="font-mono text-[11px] text-[var(--fg-muted)]">
                  Engineering Standards
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg-strong)]">
                Objective Technical Metrics
              </h3>
              <p className="text-xs leading-relaxed text-[var(--fg-muted)]">
                Evaluate developer velocity, code review engagement, and domain
                focus directly from source control without tedious git log
                manual excavation.
              </p>
              <ul className="space-y-1.5 pt-1 font-mono text-xs text-[var(--fg-muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-[var(--link)]" />
                  <span>Queried directly via GitHub REST API</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-[var(--link)]" />
                  <span>Submitted reviews only (no comment noise)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-[var(--link)]" />
                  <span>Weekly velocity stacked by kind</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Security & Pipeline Monospace Architecture Bar */}
          <div className="space-y-1.5 rounded-[2px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-4 text-left font-mono text-xs text-[var(--fg-muted)]">
            <div className="flex items-center justify-between text-xs text-[var(--fg)]">
              <span className="flex items-center gap-1.5 font-semibold text-[var(--warning)] uppercase">
                <ShieldCheck className="size-3.5" />
                <span>Security & Privacy Architecture</span>
              </span>
              <span className="text-[11px] text-[var(--fg-muted)]">
                100% Server-Only
              </span>
            </div>
            <div className="text-xs text-[var(--fg)]">
              OAuth Code Flow → AES-256-GCM Encrypted Cookie → Direct GitHub
              REST
            </div>
            <div className="text-[11px] text-[var(--fg-muted)]">
              Tokens exist strictly in backend memory and encrypted cookies.
              Zero credentials or repository data are stored in a database.
            </div>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="flex h-[24px] min-h-[24px] w-full items-center justify-between bg-[var(--bg-status)] px-3 font-mono text-xs text-white select-none">
        <span>Internship Contribution Tracker</span>
        <span>
          {session ? `Signed in: @${session.user.login}` : "Unauthenticated"}
        </span>
      </footer>
    </div>
  );
}
