import * as React from "react";
import { EditorTabs, type EditorTabItem } from "@/components/shell";
import { OverviewPanel } from "@/components/dashboard";
import { getRepository, getViewerLogin } from "@/lib/github";
import { parseDashboardParams } from "@/lib/utils/search-params";
import type { RepositorySummary } from "@/types/contributions";

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const rawParams = await searchParams;
  const parsed = parseDashboardParams(rawParams);

  // Friendly error message for invalid search parameters
  const paramError =
    parsed.errors.range ||
    parsed.errors.repo ||
    parsed.errors.from ||
    parsed.errors.to ||
    parsed.errors.tz ||
    null;

  let viewerLogin = "";
  try {
    viewerLogin = await getViewerLogin();
  } catch {
    viewerLogin = "";
  }

  let repository: RepositorySummary | null = null;
  let repoAccessError: string | null = null;

  // Before accepting a chosen repo, confirm the user can access it with GET /repos/{owner}/{repo}
  if (parsed.repo && !parsed.errors.repo) {
    const [owner, name] = parsed.repo.split("/");
    if (owner && name) {
      try {
        const repoRes = await getRepository(owner, name);
        repository = repoRes.data;
        if (!repository) {
          repoAccessError = `Repository "${parsed.repo}" not found or you do not have permission to access it.`;
        }
      } catch (err) {
        repoAccessError =
          err instanceof Error
            ? err.message
            : `Unable to access repository "${parsed.repo}".`;
      }
    }
  }

  const errorMessage = paramError || repoAccessError;
  const isSelectionActive = Boolean(
    parsed.hasSelection && parsed.isValid && repository && !errorMessage
  );

  const tabs: EditorTabItem[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <OverviewPanel
          isEmpty={!parsed.hasSelection && !errorMessage}
          errorMessage={errorMessage}
          repository={repository}
          login={viewerLogin}
          from={parsed.from}
          to={parsed.to}
          timeZone={parsed.tz}
        />
      ),
    },
    {
      id: "timeline",
      label: "Timeline",
      content: (
        <TimelinePanel
          isEmpty={!isSelectionActive}
          errorMessage={errorMessage}
          repository={repository}
        />
      ),
    },
    {
      id: "pull-requests",
      label: "Pull Requests",
      content: (
        <PullRequestsPanel
          isEmpty={!isSelectionActive}
          errorMessage={errorMessage}
          repository={repository}
        />
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <EditorTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}

/* =========================================================================
   DASHBOARD TAB PANELS
   Classic IDE styling: flat, dense, monospace data, no decorative chrome.
   ========================================================================= */

function TimelinePanel({
  isEmpty,
  errorMessage,
  repository,
}: {
  isEmpty: boolean;
  errorMessage: string | null;
  repository: RepositorySummary | null;
}) {
  if (errorMessage || isEmpty || !repository) {
    return (
      <div className="text-xs text-[var(--fg-muted)]">
        Select a repository and date range, then Load activity
      </div>
    );
  }

  return (
    <div className="text-xs text-[var(--fg-muted)]">
      Timeline activity for{" "}
      <span className="font-mono text-[var(--fg)]">{repository.fullName}</span>{" "}
      will be loaded in Step 5 & 6.
    </div>
  );
}

function PullRequestsPanel({
  isEmpty,
  errorMessage,
  repository,
}: {
  isEmpty: boolean;
  errorMessage: string | null;
  repository: RepositorySummary | null;
}) {
  if (errorMessage || isEmpty || !repository) {
    return (
      <div className="text-xs text-[var(--fg-muted)]">
        Select a repository and date range, then Load activity
      </div>
    );
  }

  return (
    <div className="text-xs text-[var(--fg-muted)]">
      Pull request summary for{" "}
      <span className="font-mono text-[var(--fg)]">{repository.fullName}</span>{" "}
      will be loaded in Step 5 & 6.
    </div>
  );
}
