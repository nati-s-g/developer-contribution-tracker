import * as React from "react";
import type { RepositorySummary } from "@/types/contributions";
import { GitBranch } from "lucide-react";
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
      <div className="space-y-2 font-sans text-xs text-[var(--removed)]">
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
      <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[2px] border border-dashed border-[var(--border)] p-8 text-center font-sans select-none">
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
