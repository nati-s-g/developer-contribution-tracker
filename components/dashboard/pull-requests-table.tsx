"use client";

import * as React from "react";
import type {
  PullRequestSummary,
  ContributionCategory,
} from "@/types/contributions";
import { categorizeContribution } from "@/lib/contributions/categorize";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullRequestsTableProps {
  pullRequests: PullRequestSummary[];
  timeZone: string;
}

type SortField =
  "number" | "title" | "state" | "date" | "changes" | "files" | "category";
type SortOrder = "asc" | "desc";

interface EnrichedPR extends PullRequestSummary {
  category: ContributionCategory;
  totalChanges: number;
}

function getCategoryColor(category: ContributionCategory): string {
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

function formatDate(isoString: string | null, timeZone: string): string {
  if (!isoString) return "--";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "--";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return isoString.slice(0, 10);
  }
}

export function PullRequestsTable({
  pullRequests,
  timeZone,
}: PullRequestsTableProps) {
  const [sortField, setSortField] = React.useState<SortField>("date");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");

  // Enrich PRs with category and total change count for sorting
  const enrichedPRs = React.useMemo<EnrichedPR[]>(() => {
    return pullRequests.map((pr) => ({
      ...pr,
      category: categorizeContribution(pr.title),
      totalChanges: pr.additions + pr.deletions,
    }));
  }, [pullRequests]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(
        field === "date" || field === "number" || field === "changes"
          ? "desc"
          : "asc"
      );
    }
  };

  const sortedPRs = React.useMemo(() => {
    const items = [...enrichedPRs];
    items.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "number":
          comparison = a.number - b.number;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "state":
          comparison = a.state.localeCompare(b.state);
          break;
        case "date": {
          const dateA = a.mergedAt || a.createdAt;
          const dateB = b.mergedAt || b.createdAt;
          comparison = dateA.localeCompare(dateB);
          break;
        }
        case "changes":
          comparison = a.totalChanges - b.totalChanges;
          break;
        case "files":
          comparison = a.changedFiles - b.changedFiles;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return items;
  }, [enrichedPRs, sortField, sortOrder]);

  const totalAdditions = pullRequests.reduce(
    (acc, pr) => acc + pr.additions,
    0
  );
  const totalDeletions = pullRequests.reduce(
    (acc, pr) => acc + pr.deletions,
    0
  );
  const mergedCount = pullRequests.filter((pr) => pr.merged).length;

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="ml-1 inline size-3 opacity-30 group-hover:opacity-70" />
      );
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 inline size-3 text-[var(--accent)]" />
    ) : (
      <ArrowDown className="ml-1 inline size-3 text-[var(--accent)]" />
    );
  };

  return (
    <div className="space-y-4 select-text">
      {/* Summary Line */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-2 font-mono text-xs">
        <div className="flex items-center gap-4 text-[var(--fg)]">
          <span>
            Pull requests:{" "}
            <strong className="text-[var(--fg-strong)]">
              {pullRequests.length}
            </strong>
          </span>
          <span className="text-[var(--border)]">|</span>
          <span>
            Merged:{" "}
            <strong className="text-[var(--merged)]">{mergedCount}</strong>
          </span>
          <span className="text-[var(--border)]">|</span>
          <span>
            Total changes:{" "}
            <span className="text-[var(--added)]">
              +{totalAdditions.toLocaleString()}
            </span>{" "}
            /{" "}
            <span className="text-[var(--removed)]">
              -{totalDeletions.toLocaleString()}
            </span>
          </span>
        </div>
        <div className="text-[11px] text-[var(--fg-muted)]">
          Click column headers to sort
        </div>
      </div>

      {/* Dense PR Table */}
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--bg-editor)]">
        <table className="w-full text-left font-sans text-xs">
          <thead>
            <tr className="h-6 border-b border-[var(--border)] bg-[var(--bg-sidebar)] font-mono text-[11px] tracking-wider text-[var(--fg-muted)] uppercase">
              <th
                onClick={() => handleSort("number")}
                className="group w-16 cursor-pointer px-2 text-right select-none hover:text-[var(--fg-strong)]"
              >
                # {renderSortIndicator("number")}
              </th>
              <th
                onClick={() => handleSort("title")}
                className="group cursor-pointer px-2 select-none hover:text-[var(--fg-strong)]"
              >
                Title {renderSortIndicator("title")}
              </th>
              <th
                onClick={() => handleSort("state")}
                className="group w-24 cursor-pointer px-2 select-none hover:text-[var(--fg-strong)]"
              >
                State {renderSortIndicator("state")}
              </th>
              <th
                onClick={() => handleSort("date")}
                className="group w-24 cursor-pointer px-2 select-none hover:text-[var(--fg-strong)]"
              >
                Merged / Date {renderSortIndicator("date")}
              </th>
              <th
                onClick={() => handleSort("changes")}
                className="group w-28 cursor-pointer px-2 text-right select-none hover:text-[var(--fg-strong)]"
              >
                Changes {renderSortIndicator("changes")}
              </th>
              <th
                onClick={() => handleSort("files")}
                className="group w-16 cursor-pointer px-2 text-right select-none hover:text-[var(--fg-strong)]"
              >
                Files {renderSortIndicator("files")}
              </th>
              <th
                onClick={() => handleSort("category")}
                className="group w-20 cursor-pointer px-2 select-none hover:text-[var(--fg-strong)]"
              >
                Category {renderSortIndicator("category")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
            {sortedPRs.map((pr) => {
              const stateDotClass = pr.merged
                ? "bg-[var(--merged)]"
                : pr.state === "open"
                  ? "bg-[var(--open)]"
                  : "bg-[var(--closed)]";

              const stateLabel = pr.merged
                ? "merged"
                : pr.draft
                  ? "draft"
                  : pr.state;

              return (
                <tr
                  key={pr.number}
                  className="h-6 transition-colors hover:bg-[var(--hover)]"
                >
                  {/* PR Number */}
                  <td className="px-2 text-right">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--link)] hover:underline"
                    >
                      <span>#{pr.number}</span>
                      <ExternalLink className="size-2.5 opacity-60" />
                    </a>
                  </td>

                  {/* Title */}
                  <td className="px-2 font-sans">
                    <div className="flex max-w-md items-center gap-1.5 truncate">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-[var(--fg)] hover:text-[var(--fg-strong)] hover:underline"
                        title={pr.title}
                      >
                        {pr.title}
                      </a>
                    </div>
                  </td>

                  {/* State (Colored-dot tag) */}
                  <td className="px-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--fg)]">
                      <span
                        className={cn("size-2 rounded-full", stateDotClass)}
                      />
                      <span>{stateLabel}</span>
                    </span>
                  </td>

                  {/* Merged / Event Date */}
                  <td className="px-2 text-[11px] text-[var(--fg-muted)]">
                    {formatDate(pr.mergedAt || pr.createdAt, timeZone)}
                  </td>

                  {/* Changes (+add / -del) */}
                  <td className="px-2 text-right text-[11px]">
                    <span className="text-[var(--added)]">
                      +{pr.additions.toLocaleString()}
                    </span>
                    {" / "}
                    <span className="text-[var(--removed)]">
                      -{pr.deletions.toLocaleString()}
                    </span>
                  </td>

                  {/* Changed Files */}
                  <td className="px-2 text-right text-[11px] text-[var(--fg-muted)]">
                    {pr.changedFiles}
                  </td>

                  {/* Category */}
                  <td className="px-2">
                    <span
                      className={`inline-block rounded-[2px] border px-1 font-mono text-[10px] ${getCategoryColor(
                        pr.category
                      )}`}
                    >
                      {pr.category}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
