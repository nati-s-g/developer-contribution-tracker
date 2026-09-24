import * as React from "react";
import type { RepositorySummary } from "@/types/contributions";
import {
  TimelineActivity,
  TimelineActivitySkeleton,
} from "./timeline-activity";

interface TimelinePanelProps {
  isEmpty: boolean;
  errorMessage: string | null;
  repository: RepositorySummary | null;
  login: string;
  from: string | null;
  to: string | null;
  timeZone: string;
}

export function TimelinePanel({
  isEmpty,
  errorMessage,
  repository,
  login,
  from,
  to,
  timeZone,
}: TimelinePanelProps) {
  if (errorMessage) {
    return (
      <div className="space-y-2 font-mono text-xs text-[var(--removed)]">
        <div>Error: {errorMessage}</div>
        <div className="text-[var(--fg-muted)]">
          Select a valid repository and date range in the sidebar, then Load
          activity.
        </div>
      </div>
    );
  }

  if (isEmpty || !repository || !from || !to) {
    return (
      <div className="text-xs text-[var(--fg-muted)]">
        Select a repository and date range, then Load activity
      </div>
    );
  }

  const [owner, name] = repository.fullName.split("/");

  return (
    <div className="space-y-6">
      {/* Scope Header */}
      <div className="space-y-1 border-b border-[var(--border)] pb-3 font-mono text-xs">
        <div>
          <span className="text-[var(--fg-muted)]">repo: </span>
          <span className="text-[var(--fg-strong)]">{repository.fullName}</span>
          {repository.private ? (
            <span className="ml-2 text-[10px] text-[var(--warning)]">
              [private]
            </span>
          ) : (
            <span className="ml-2 text-[10px] text-[var(--fg-muted)]">
              [public]
            </span>
          )}
        </div>
        <div>
          <span className="text-[var(--fg-muted)]">range: </span>
          <span className="text-[var(--fg)]">
            {from} → {to}
          </span>
        </div>
        <div>
          <span className="text-[var(--fg-muted)]">tz: </span>
          <span className="text-[var(--fg)]">{timeZone}</span>
        </div>
        <div>
          <span className="text-[var(--fg-muted)]">author: </span>
          <span className="text-[var(--link)]">@{login}</span>
        </div>
      </div>

      {/* Activity Timeline with Suspense Loading */}
      <React.Suspense fallback={<TimelineActivitySkeleton />}>
        <TimelineActivity
          owner={owner}
          repo={name}
          login={login}
          from={from}
          to={to}
          timeZone={timeZone}
        />
      </React.Suspense>
    </div>
  );
}
