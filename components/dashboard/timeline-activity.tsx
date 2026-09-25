import * as React from "react";
import { getRepositoryActivity, buildTimeline } from "@/lib/contributions";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { ActivityItem } from "@/types/contributions";

interface TimelineActivityProps {
  owner: string;
  repo: string;
  login: string;
  from: string;
  to: string;
  timeZone: string;
}

function formatLocalTime(isoString: string, timeZone: string): string {
  if (!isoString) return "--:--";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "--:--";
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(d);
  } catch {
    return "--:--";
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "feature":
      return "text-[var(--open)] border-[var(--open)]/40";
    case "bugfix":
      return "text-[var(--removed)] border-[var(--removed)]/40";
    case "refactor":
      return "text-[var(--warning)] border-[var(--warning)]/40";
    case "docs":
      return "text-[var(--link)] border-[var(--link)]/40";
    case "test":
      return "text-[#4ec9b0] border-[#4ec9b0]/40";
    case "chore":
      return "text-[var(--fg-muted)] border-[var(--border)]";
    default:
      return "text-[var(--fg-muted)] border-[var(--border)]";
  }
}

function renderKindTag(item: ActivityItem) {
  switch (item.kind) {
    case "commit":
      return (
        <span className="font-mono text-[10px] text-[var(--fg-muted)]">
          [commit]
        </span>
      );
    case "pull_request":
      return (
        <span className="font-mono text-[10px] text-[var(--link)]">
          {item.merged ? "[pr:merged]" : item.draft ? "[pr:draft]" : "[pr]"}
        </span>
      );
    case "issue":
      return (
        <span className="font-mono text-[10px] text-[var(--open)]">
          [issue]
        </span>
      );
    case "review":
      return (
        <span className="font-mono text-[10px] text-[var(--merged)]">
          [review]
        </span>
      );
  }
}

function renderReference(item: ActivityItem) {
  let label = "";
  switch (item.kind) {
    case "commit":
      label = item.shortSha;
      break;
    case "pull_request":
    case "issue":
      label = `#${item.number}`;
      break;
    case "review":
      label = `#${item.prNumber}`;
      break;
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-[var(--link)] hover:underline"
    >
      <span>{label}</span>
      <ExternalLink className="size-3.5 text-[var(--fg-muted)] opacity-70" />
    </a>
  );
}

/**
 * Async Server Component that fetches repository activity and renders the chronological timeline.
 */
export async function TimelineActivity({
  owner,
  repo,
  login,
  from,
  to,
  timeZone,
}: TimelineActivityProps) {
  const activity = await getRepositoryActivity(owner, repo, login, from, to);
  const groups = buildTimeline(activity, timeZone);

  const hasProblems =
    activity.errors.length > 0 || activity.warnings.length > 0;

  return (
    <div className="space-y-6 select-text">
      {/* Problems Notice */}
      {hasProblems && (
        <div className="rounded-[2px] border border-[var(--border)] bg-[var(--bg-editor)] p-3 text-xs">
          <div className="flex items-center gap-1.5 pb-2 font-mono text-[11px] font-semibold tracking-wider text-[var(--warning)] uppercase">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>
              Problems ({activity.errors.length + activity.warnings.length})
            </span>
          </div>
          <ul className="space-y-1 font-mono text-xs">
            {activity.errors.map((err, i) => (
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
            {activity.warnings.map((warn, i) => (
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

      {groups.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--bg-editor)] p-4 text-xs text-[var(--fg-muted)]">
          No contribution activity found for{" "}
          <span className="font-mono text-[var(--fg)]">@{login}</span> in this
          repository and date range.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.date}
              className="border border-[var(--border)] bg-[var(--bg-editor)]"
            >
              {/* Date Group Header */}
              <div className="flex h-6 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-2 font-sans text-xs">
                <span className="font-semibold text-[var(--fg-strong)]">
                  {group.date}
                </span>
                <span className="text-[11px] text-[var(--fg-muted)]">
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "activity" : "activities"}
                </span>
              </div>

              {/* Items in this Day */}
              <div className="divide-y divide-[var(--border)]">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex h-6 items-center gap-2 px-2 text-xs transition-colors hover:bg-[var(--hover)]"
                  >
                    {/* Local Time */}
                    <span className="w-10 shrink-0 font-mono text-[11px] text-[var(--fg-muted)]">
                      {formatLocalTime(item.occurredAt, timeZone)}
                    </span>

                    {/* Kind Badge */}
                    <span className="w-20 shrink-0">{renderKindTag(item)}</span>

                    {/* Reference # / SHA */}
                    <div className="w-16 shrink-0 truncate">
                      {renderReference(item)}
                    </div>

                    {/* Title */}
                    <span className="flex-1 truncate font-sans text-[var(--fg)]">
                      {item.title}
                    </span>

                    {/* Category Tag */}
                    <span
                      className={`shrink-0 rounded-[2px] border px-1 font-mono text-[10px] ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton fallback for the Timeline tab.
 */
export function TimelineActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="border border-[var(--border)] bg-[var(--bg-editor)]"
        >
          <div className="flex h-6 items-center border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-2 py-1">
            <div className="h-3 w-28 animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          </div>
          <div className="space-y-1 divide-y divide-[var(--border)] p-1">
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
            <div className="h-5 w-full animate-pulse rounded-[1px] bg-[var(--bg-tab)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
