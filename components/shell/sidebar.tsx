"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SidebarSection } from "@/components/shell/sidebar-section";
import { RepositoryPicker } from "@/components/dashboard/repository-picker";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import type { RepositorySummary } from "@/types/contributions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  repositories?: RepositorySummary[];
  selectedRepo?: string | null;
  initialFrom?: string;
  initialTo?: string;
  initialTimeZone?: string;
  isLoadingRepos?: boolean;
  repoError?: string | null;
  onRefreshRepos?: () => void;
  onApplied?: () => void;
}

export function Sidebar({
  className,
  repositories = [],
  selectedRepo: initialSelectedRepo = null,
  initialFrom,
  initialTo,
  initialTimeZone,
  isLoadingRepos = false,
  repoError = null,
  onRefreshRepos,
  onApplied,
}: SidebarProps) {
  const router = useRouter();
  const [selectedRepo, setSelectedRepo] = React.useState<string | null>(
    initialSelectedRepo
  );

  const handleSelectRepo = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
  };

  const handleApplyRange = (from: string, to: string, timeZone: string) => {
    if (!selectedRepo) return;
    const params = new URLSearchParams();
    params.set("repo", selectedRepo);
    params.set("from", from);
    params.set("to", to);
    params.set("tz", timeZone);
    router.push(`/dashboard?${params.toString()}`);
    onApplied?.();
  };

  return (
    <aside
      aria-label="Activity Filters"
      className={cn(
        "flex h-full flex-col bg-[var(--bg-sidebar)] text-[var(--fg)] select-none",
        className
      )}
    >
      {/* REPOSITORY Section */}
      <SidebarSection title="REPOSITORY" defaultOpen={true}>
        <RepositoryPicker
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelect={handleSelectRepo}
          isLoading={isLoadingRepos}
          error={repoError}
          onRefresh={onRefreshRepos}
        />
      </SidebarSection>

      {/* DATE RANGE Section */}
      <SidebarSection title="DATE RANGE" defaultOpen={true}>
        <DateRangePicker
          key={`${initialFrom || "default"}-${initialTo || "default"}`}
          initialFrom={initialFrom}
          initialTo={initialTo}
          initialTimeZone={initialTimeZone}
          hasRepository={Boolean(selectedRepo)}
          onApply={handleApplyRange}
        />
      </SidebarSection>
    </aside>
  );
}
