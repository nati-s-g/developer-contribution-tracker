import * as React from "react";
import { GitBranch, Lock, Calendar, ExternalLink } from "lucide-react";
import type { AnalysisContext } from "@/types/contributions";

interface AnalysisContextCardProps {
  context: AnalysisContext;
}

export function AnalysisContextCard({ context }: AnalysisContextCardProps) {
  const { repository, dateRange, daysCount, isValid, validationError } =
    context;

  if (!repository) {
    return (
      <div className="rounded-[2px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--fg-muted)]">
          <GitBranch className="size-4 shrink-0 text-[var(--link)]" />
          <span className="font-sans font-medium text-[var(--fg)]">
            No repository selected
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
          Choose a repository and date range in the sidebar to configure the
          analysis scope.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-[2px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-3 font-sans text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          {repository.private ? (
            <Lock className="size-3.5 shrink-0 text-[var(--warning)]" />
          ) : (
            <GitBranch className="size-3.5 shrink-0 text-[var(--link)]" />
          )}
          <span className="text-[11px] tracking-wider text-[var(--fg-muted)] uppercase">
            Repository:
          </span>
          <a
            href={repository.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono font-semibold text-[var(--link)] hover:underline"
          >
            <span>{repository.fullName}</span>
            <ExternalLink className="size-3 opacity-70" />
          </a>
          <span className="rounded-[2px] border border-[var(--border)] px-1 text-[10px] text-[var(--fg-muted)]">
            {repository.private ? "private" : "public"}
          </span>
        </div>

        <div className="font-mono text-[11px] text-[var(--fg-muted)]">
          branch:{" "}
          <span className="text-[var(--fg)]">{repository.defaultBranch}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-[var(--fg-muted)]" />
          <span className="font-sans text-[11px] tracking-wider text-[var(--fg-muted)] uppercase">
            Analysis Period:
          </span>
          <span className="text-[var(--fg-strong)]">
            {dateRange.from} → {dateRange.to}
          </span>
          <span className="text-[11px] text-[var(--fg-muted)]">
            ({daysCount} {daysCount === 1 ? "day" : "days"})
          </span>
        </div>

        <div className="text-[11px] text-[var(--fg-muted)]">
          tz: <span className="text-[var(--fg)]">{dateRange.timeZone}</span>
        </div>
      </div>

      {!isValid && validationError && (
        <div className="pt-1 text-[11px] text-[var(--removed)]">
          {validationError}
        </div>
      )}
    </div>
  );
}
