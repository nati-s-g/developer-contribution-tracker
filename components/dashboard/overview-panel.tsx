import * as React from "react";
import type { RepositorySummary } from "@/types/contributions";
import { GitBranch } from "lucide-react";
import {
  OverviewActivity,
  OverviewActivitySkeleton,
} from "./overview-activity";

interface OverviewPanelProps {
  isEmpty: boolean;
  errorMessage: string | null;
  repository: RepositorySummary | null;
  login: string;
  from: string | null;
  to: string | null;
  timeZone: string;
}

export function OverviewPanel({
  isEmpty,
  errorMessage,
  repository,
  login,
  from,
  to,
  timeZone,
}: OverviewPanelProps) {
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
      <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[2px] border border-dashed border-[var(--border)] p-8 text-center select-none">
        <GitBranch className="mb-3 size-8 text-[var(--link)] opacity-80" />
        <h3 className="text-sm font-semibold text-[var(--fg-strong)]">
          No Repository Selected
        </h3>
        <p className="mt-1.5 text-xs text-[var(--fg-muted)]">
          Select a repository and date range, then click{" "}
          <strong className="text-[var(--fg)]">Load activity</strong>.
        </p>
      </div>
    );
  }

  const [owner, name] = repository.fullName.split("/");

  return (
    <div className="space-y-6">
      {/* Plain Text Scope Header */}
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

      {/* Activity Data with Suspense Loading */}
      <React.Suspense fallback={<OverviewActivitySkeleton />}>
        <OverviewActivity
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
