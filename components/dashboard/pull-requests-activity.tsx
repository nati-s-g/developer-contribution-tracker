import * as React from "react";
import { getRepositoryActivity } from "@/lib/contributions";
import { PullRequestsTable } from "./pull-requests-table";
import { AlertTriangle } from "lucide-react";

interface PullRequestsActivityProps {
  owner: string;
  repo: string;
  login: string;
  from: string;
  to: string;
  timeZone: string;
}

export async function PullRequestsActivity({
  owner,
  repo,
  login,
  from,
  to,
  timeZone,
}: PullRequestsActivityProps) {
  const activity = await getRepositoryActivity(owner, repo, login, from, to);
  const { pullRequests, errors, warnings } = activity;

  const hasProblems = errors.length > 0 || warnings.length > 0;

  return (
    <div className="space-y-6 select-text">
      {/* Problems Notice */}
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

      {/* Empty State or PR Table */}
      {pullRequests.length === 0 ? (
        <div className="space-y-3 border border-[var(--border)] bg-[var(--bg-editor)] p-4 text-xs text-[var(--fg-muted)]">
          <div>
            No pull requests found for{" "}
            <span className="font-mono text-[var(--fg)]">@{login}</span> in this
            repository and date range.
          </div>
          <div className="space-y-1 font-mono text-[11px] text-[var(--fg-muted)]">
            <div className="text-[var(--fg)]">Hints:</div>
            <div>
              • Confirm the selected date range covers when your pull requests
              were created or merged.
            </div>
            <div>
              • Ensure your GitHub username (@{login}) matches the author of the
              pull requests.
            </div>
          </div>
        </div>
      ) : (
        <PullRequestsTable pullRequests={pullRequests} timeZone={timeZone} />
      )}
    </div>
  );
}

export function PullRequestsActivitySkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary Line Skeleton */}
      <div className="flex h-6 items-center gap-4 border-b border-[var(--border)] pb-2">
        <div className="h-3 w-64 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
      </div>

      {/* Table Skeleton */}
      <div className="border border-[var(--border)] bg-[var(--bg-editor)]">
        <div className="flex h-6 items-center border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-2">
          <div className="h-3 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
        </div>
        <div className="space-y-1 divide-y divide-[var(--border)] p-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-6 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
