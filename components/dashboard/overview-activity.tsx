import {
  getRepositoryActivity,
  summarizeContributions,
  buildWeeklyActivity,
  buildCategoryChartData,
} from "@/lib/contributions";
import { ActivityCharts } from "./activity-charts";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewActivityProps {
  owner: string;
  repo: string;
  login: string;
  from: string;
  to: string;
  timeZone: string;
}

function formatDate(isoString: string): string {
  if (!isoString) return "--";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return isoString;
  }
}

/**
 * Async Server Component that fetches and renders the user's complete contribution summary
 * (commits, pull requests, issues, reviews) and latest activity for the selected scope.
 */
export async function OverviewActivity({
  owner,
  repo,
  login,
  from,
  to,
  timeZone,
}: OverviewActivityProps) {
  const activity = await getRepositoryActivity(owner, repo, login, from, to);
  const { commits, pullRequests, errors, warnings } = activity;

  const summary = summarizeContributions(activity, timeZone);
  const recentCommits = commits.slice(0, 10);
  const recentPrs = pullRequests.slice(0, 10);

  const totalContributions =
    commits.length +
    pullRequests.length +
    activity.issues.length +
    activity.reviews.length;
  const weeklyData = buildWeeklyActivity(activity, from, to, timeZone);
  const categoryData = buildCategoryChartData(summary);

  const hasProblems = errors.length > 0 || warnings.length > 0;

  return (
    <div className="space-y-6 select-text">
      {/* Empty State with Hints */}
      {totalContributions === 0 && (
        <div className="space-y-3 border border-[var(--border)] bg-[var(--bg-editor)] p-4 text-xs text-[var(--fg-muted)]">
          <div className="text-[var(--fg)]">
            No contributions found for{" "}
            <span className="font-mono font-medium text-[var(--fg-strong)]">
              @{login}
            </span>{" "}
            in this repository and date range.
          </div>
          <div className="space-y-1 font-mono text-[11px] text-[var(--fg-muted)]">
            <div className="font-semibold text-[var(--fg)]">Hints:</div>
            <div>
              • Check the date range to ensure it covers your contribution
              period.
            </div>
            <div>
              • Verify commit-email linking: ensure your local git commit email
              is linked to your GitHub account (GitHub Settings → Emails).
            </div>
            <div>
              • Commits analysis evaluates the repository default branch only.
            </div>
          </div>
        </div>
      )}

      {/* Problems Notice (Inline IDE Problems style) */}
      {hasProblems && (
        <div className="rounded-[2px] border border-[var(--border)] bg-[var(--bg-editor)] p-3 text-xs">
          <div className="flex items-center gap-1.5 pb-2 font-mono text-[11px] font-semibold tracking-wider text-[var(--warning)] uppercase">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>Problems ({errors.length + warnings.length})</span>
          </div>
          <ul className="space-y-1 font-mono text-xs">
            {errors.map((err, i) => (
              <li
                key={`err-${i}`}
                className="flex items-start gap-2 text-[var(--removed)]"
              >
                <span className="shrink-0 text-[10px] uppercase opacity-80">
                  [{err.source}]
                </span>
                <span>{err.message}</span>
              </li>
            ))}
            {warnings.map((warn, i) => (
              <li
                key={`warn-${i}`}
                className="flex items-start gap-2 text-[var(--warning)]"
              >
                <span className="shrink-0 text-[10px] uppercase opacity-80">
                  [warning]
                </span>
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Counts & By Category Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Full Stat Rows from ContributionSummary */}
        <div className="space-y-1.5 font-sans">
          <h3 className="text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
            Summary
          </h3>
          <table className="w-full border border-[var(--border)] bg-[var(--bg-editor)] font-sans text-xs">
            <tbody>
              <tr className="h-6 border-b border-[var(--border)] transition-colors hover:bg-[var(--hover)]">
                <td className="px-2 text-[var(--fg-muted)]">Commits</td>
                <td className="px-2 text-right font-medium text-[var(--fg-strong)]">
                  {summary.commits}
                </td>
              </tr>
              <tr className="h-6 border-b border-[var(--border)] transition-colors hover:bg-[var(--hover)]">
                <td className="px-2 text-[var(--fg-muted)]">Pull requests</td>
                <td className="px-2 text-right font-medium text-[var(--fg-strong)]">
                  {summary.pullRequests}
                </td>
              </tr>
              <tr className="h-6 border-b border-[var(--border)] transition-colors hover:bg-[var(--hover)]">
                <td className="px-2 text-[var(--fg-muted)]">
                  Merged pull requests
                </td>
                <td className="px-2 text-right font-medium text-[var(--fg-strong)]">
                  {summary.mergedPullRequests}
                </td>
              </tr>
              <tr className="h-6 border-b border-[var(--border)] transition-colors hover:bg-[var(--hover)]">
                <td className="px-2 text-[var(--fg-muted)]">Issues opened</td>
                <td className="px-2 text-right font-medium text-[var(--fg-strong)]">
                  {summary.issues}
                </td>
              </tr>
              <tr className="h-6 border-b border-[var(--border)] transition-colors hover:bg-[var(--hover)]">
                <td className="px-2 text-[var(--fg-muted)]">
                  Reviews submitted
                </td>
                <td className="px-2 text-right font-medium text-[var(--fg-strong)]">
                  {summary.reviews}
                </td>
              </tr>
              <tr className="h-6 border-b border-[var(--border)] transition-colors hover:bg-[var(--hover)]">
                <td className="px-2 text-[var(--fg-muted)]">Active days</td>
                <td className="px-2 text-right font-medium text-[var(--fg-strong)]">
                  {summary.activeDays}
                </td>
              </tr>
              <tr className="h-6 transition-colors hover:bg-[var(--hover)]">
                <td className="px-2 text-[var(--fg-muted)]">Code changes</td>
                <td className="px-2 text-right font-mono font-medium">
                  <span className="text-[var(--added)]">
                    +{summary.additions}
                  </span>{" "}
                  <span className="text-[var(--removed)]">
                    -{summary.deletions}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* By Category Breakdown */}
        <div className="space-y-1.5 font-sans">
          <h3 className="text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
            Categories
          </h3>
          <table className="w-full border border-[var(--border)] bg-[var(--bg-editor)] font-sans text-xs">
            <tbody>
              {(
                [
                  "feature",
                  "bugfix",
                  "refactor",
                  "docs",
                  "test",
                  "chore",
                  "other",
                ] as const
              ).map((cat, idx, arr) => (
                <tr
                  key={cat}
                  className={cn(
                    "h-6 transition-colors hover:bg-[var(--hover)]",
                    idx < arr.length - 1 && "border-b border-[var(--border)]"
                  )}
                >
                  <td className="px-2 text-[var(--fg-muted)]">{cat}</td>
                  <td className="px-2 text-right font-medium text-[var(--fg-strong)]">
                    {summary.byCategory[cat]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Restrained Recharts: Weekly Activity & Category Breakdown */}
      <ActivityCharts weeklyData={weeklyData} categoryData={categoryData} />

      {/* Commits List */}
      <div className="space-y-1.5 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
            Commits ({commits.length})
          </h3>
          {commits.length > 10 && (
            <span className="text-[10px] text-[var(--fg-muted)]">
              Showing 10 most recent
            </span>
          )}
        </div>

        {commits.length === 0 ? (
          <div className="border border-[var(--border)] bg-[var(--bg-editor)] p-3 text-xs text-[var(--fg-muted)]">
            No commits found for author{" "}
            <span className="font-mono text-[var(--fg)]">@{login}</span> in this
            period on the default branch.
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-[var(--border)] bg-[var(--bg-editor)]">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--bg-sidebar)] font-sans text-[11px] tracking-wider text-[var(--fg-muted)] uppercase">
                <tr className="h-6">
                  <th className="w-20 px-2 font-medium">SHA</th>
                  <th className="px-2 font-medium">Message</th>
                  <th className="w-36 px-2 text-right font-medium">
                    Date (UTC)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-sans">
                {recentCommits.map((commit) => (
                  <tr
                    key={commit.sha}
                    className="h-6 transition-colors hover:bg-[var(--hover)]"
                  >
                    <td className="px-2 whitespace-nowrap">
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[var(--link)] hover:underline"
                        title={commit.sha}
                      >
                        <span>{commit.shortSha}</span>
                        <ExternalLink className="size-3.5 text-[var(--fg-muted)] opacity-70" />
                      </a>
                    </td>
                    <td className="max-w-md truncate px-2 font-sans text-[var(--fg)]">
                      {commit.message}
                    </td>
                    <td className="px-2 text-right text-[11px] whitespace-nowrap text-[var(--fg-muted)]">
                      {formatDate(commit.authoredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pull Requests List */}
      <div className="space-y-1.5 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
            Pull requests ({pullRequests.length})
          </h3>
          {pullRequests.length > 10 && (
            <span className="text-[10px] text-[var(--fg-muted)]">
              Showing 10 most recent
            </span>
          )}
        </div>

        {pullRequests.length === 0 ? (
          <div className="border border-[var(--border)] bg-[var(--bg-editor)] p-3 text-xs text-[var(--fg-muted)]">
            No pull requests created or merged by{" "}
            <span className="font-mono text-[var(--fg)]">@{login}</span> in this
            period.
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-[var(--border)] bg-[var(--bg-editor)]">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-[var(--border)] bg-[var(--bg-sidebar)] font-sans text-[11px] tracking-wider text-[var(--fg-muted)] uppercase">
                <tr className="h-6">
                  <th className="w-16 px-2 font-medium">PR</th>
                  <th className="px-2 font-medium">Title</th>
                  <th className="w-20 px-2 font-medium">State</th>
                  <th className="w-28 px-2 text-right font-medium">Diff</th>
                  <th className="w-36 px-2 text-right font-medium">
                    Date (UTC)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-sans">
                {recentPrs.map((pr) => (
                  <tr
                    key={pr.number}
                    className="h-6 transition-colors hover:bg-[var(--hover)]"
                  >
                    <td className="px-2 whitespace-nowrap">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[var(--link)] hover:underline"
                      >
                        <span>#{pr.number}</span>
                        <ExternalLink className="size-3.5 text-[var(--fg-muted)] opacity-70" />
                      </a>
                    </td>
                    <td className="max-w-md truncate px-2 font-sans text-[var(--fg)]">
                      {pr.title}
                    </td>
                    <td className="px-2 text-[11px] whitespace-nowrap">
                      {pr.merged ? (
                        <span className="text-[var(--merged)]">merged</span>
                      ) : pr.draft ? (
                        <span className="text-[var(--fg-muted)]">draft</span>
                      ) : pr.state === "open" ? (
                        <span className="text-[var(--open)]">open</span>
                      ) : (
                        <span className="text-[var(--closed)]">closed</span>
                      )}
                    </td>
                    <td className="px-2 text-right font-mono text-[11px] whitespace-nowrap">
                      <span className="text-[var(--added)]">
                        +{pr.additions}
                      </span>{" "}
                      <span className="text-[var(--removed)]">
                        -{pr.deletions}
                      </span>
                    </td>
                    <td className="px-2 text-right text-[11px] whitespace-nowrap text-[var(--fg-muted)]">
                      {formatDate(pr.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GitHub API Rate Limit Footer */}
      {activity.rateLimit && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 font-sans text-[11px] text-[var(--fg-muted)]">
          <span>
            GitHub API:{" "}
            <span className="font-mono text-[var(--fg-strong)]">
              {activity.rateLimit.remaining}
            </span>{" "}
            / <span className="font-mono">{activity.rateLimit.limit}</span>{" "}
            requests remaining
          </span>
          <span>
            Resets at{" "}
            <span className="font-mono">
              {new Date(activity.rateLimit.reset).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone,
              })}
            </span>{" "}
            ({timeZone})
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton fallback shown while Overview activity data is loading.
 */
export function OverviewActivitySkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat rows skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="h-3 w-28 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="w-full space-y-1 border border-[var(--border)] bg-[var(--bg-editor)] p-1">
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="w-full space-y-1 border border-[var(--border)] bg-[var(--bg-editor)] p-1">
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          </div>
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-56 border border-[var(--border)] bg-[var(--bg-editor)] p-3">
          <div className="h-4 w-40 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="mt-4 h-40 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
        </div>
        <div className="h-56 border border-[var(--border)] bg-[var(--bg-editor)] p-3">
          <div className="h-4 w-40 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="mt-4 h-40 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
        </div>
      </div>

      {/* Commits table skeleton */}
      <div className="space-y-1.5">
        <div className="h-3 w-32 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
        <div className="w-full space-y-1.5 border border-[var(--border)] bg-[var(--bg-editor)] p-2">
          <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
        </div>
      </div>

      {/* PRs table skeleton */}
      <div className="space-y-1.5">
        <div className="h-3 w-36 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
        <div className="w-full space-y-1.5 border border-[var(--border)] bg-[var(--bg-editor)] p-2">
          <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
        </div>
      </div>
    </div>
  );
}
