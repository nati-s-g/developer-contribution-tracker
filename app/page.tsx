import Link from "next/link";
import { Terminal, ArrowRight, AlertCircle, LogOut } from "lucide-react";
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
      <header className="flex h-[35px] min-h-[35px] w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg-titlebar)] px-3 text-xs select-none">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-[var(--link)]" />
          <span className="font-medium text-[var(--fg-strong)]">
            Internship Contribution Tracker
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--fg-muted)]">
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
                className="h-6 cursor-pointer gap-1 rounded-[2px] px-2 text-xs text-[var(--fg-muted)] hover:bg-[var(--hover)] hover:text-[var(--fg-strong)] focus-visible:outline-1 focus-visible:outline-[var(--focus)]"
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
          <span>Welcome</span>
        </div>
      </div>

      {/* Welcome Document Content */}
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-xl space-y-6">
          {/* Header block */}
          <div className="space-y-1">
            <h1 className="text-xl font-normal tracking-tight text-[var(--fg-strong)]">
              Internship Contribution Tracker
            </h1>
            <p className="text-xs text-[var(--fg-muted)]">
              Developer Contribution Report Generator: Turn your repository
              activity over a chosen date range into a clear contribution
              summary.
            </p>
          </div>

          {/* Error Banner if redirect from OAuth failure */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-2 border border-[var(--removed)] bg-[var(--bg-sidebar)] px-3 py-2 text-xs text-[var(--removed)]"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Start Section */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
              Start
            </div>

            <div className="space-y-3">
              {session ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-[var(--fg)]">
                    <span className="size-2 rounded-full bg-[var(--open)]" />
                    <span>Signed in as @{session.user.login}</span>
                  </div>
                  <div>
                    <Link
                      href="/dashboard"
                      className="inline-flex h-7 items-center gap-1.5 rounded-[2px] bg-[var(--accent)] px-3 text-xs font-medium text-white hover:bg-[var(--accent)]/90 focus-visible:outline-1 focus-visible:outline-[var(--focus)]"
                    >
                      <span>Open dashboard</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href="/api/auth/github"
                    className="inline-flex h-7 items-center rounded-[2px] bg-[var(--accent)] px-3 text-xs font-medium text-white hover:bg-[var(--accent)]/90 focus-visible:outline-1 focus-visible:outline-[var(--focus)]"
                  >
                    <GithubIcon className="mr-1.5 size-3.5" />
                    Sign in with GitHub
                  </a>
                  <span className="text-[11px] text-[var(--fg-muted)]">
                    (Requires GitHub authorization)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Architecture / Pipeline info */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
              Security & Pipeline
            </div>
            <div className="space-y-1.5 border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 font-mono text-xs text-[var(--fg-muted)]">
              <div className="text-[var(--fg)]">
                OAuth Code Flow → Encrypted HttpOnly Cookie → Server Token
                Access
              </div>
              <div className="text-[11px] text-[var(--fg-muted)]">
                Tokens are encrypted server-side and never exposed to the
                browser. No third-party database is required for session
                storage.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="flex h-[22px] min-h-[22px] w-full items-center justify-between bg-[var(--bg-status)] px-2 font-mono text-[11px] text-white select-none">
        <span>Internship Contribution Tracker</span>
        <span>
          {session ? `Signed in: @${session.user.login}` : "Unauthenticated"}
        </span>
      </footer>
    </div>
  );
}
