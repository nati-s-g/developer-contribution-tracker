"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { TitleBar } from "@/components/shell/title-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { StatusBar } from "@/components/shell/status-bar";
import type { RepositorySummary } from "@/types/contributions";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface DashboardShellProps {
  children: React.ReactNode;
  user?: string | null;
  repositories?: RepositorySummary[];
  repoError?: string | null;
}

export function DashboardShell({
  children,
  user = null,
  repositories = [],
  repoError = null,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const searchParams = useSearchParams();

  const selectedRepo = searchParams?.get("repo") || null;
  const from = searchParams?.get("from") || undefined;
  const to = searchParams?.get("to") || undefined;
  const timeZone = searchParams?.get("tz") || "UTC";

  const formattedRange = from && to ? `${from} → ${to}` : "--";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--bg-editor)] text-[var(--fg)]">
      {/* Title Bar */}
      <TitleBar
        user={user}
        onOpenMobileSidebar={() => setMobileMenuOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop View: Resizable Sidebar + Editor Area */}
        <div className="hidden h-full w-full md:block">
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel
              defaultSize="22%"
              minSize="16%"
              maxSize="38%"
              collapsible={true}
              className="min-w-[200px]"
            >
              <Sidebar
                key={`desktop-${selectedRepo || ""}-${from || ""}-${to || ""}-${timeZone}`}
                repositories={repositories}
                selectedRepo={selectedRepo}
                initialFrom={from}
                initialTo={to}
                initialTimeZone={timeZone}
                repoError={repoError}
                className="h-full border-r border-[var(--border)]"
              />
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-[var(--border)] transition-colors hover:bg-[var(--accent)] active:bg-[var(--accent)]" />

            <ResizablePanel defaultSize="78%" className="flex-1">
              <main className="h-full w-full overflow-hidden">{children}</main>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Mobile View: Full Width Main Area */}
        <div className="flex h-full w-full md:hidden">
          <main className="h-full w-full overflow-hidden">{children}</main>
        </div>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="left"
            className="w-72 max-w-[85vw] gap-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Activity Filters</SheetTitle>
              <SheetDescription>
                Repository and date range selection sidebar
              </SheetDescription>
            </SheetHeader>

            <div className="flex h-[35px] items-center border-b border-[var(--border)] px-3 text-xs font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
              Activity Filters
            </div>

            <div className="flex-1 overflow-y-auto">
              <Sidebar
                key={`mobile-${selectedRepo || ""}-${from || ""}-${to || ""}-${timeZone}`}
                repositories={repositories}
                selectedRepo={selectedRepo}
                initialFrom={from}
                initialTo={to}
                initialTimeZone={timeZone}
                repoError={repoError}
                onApplied={() => setMobileMenuOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Status Bar */}
      <StatusBar
        repo={selectedRepo || "none selected"}
        range={formattedRange}
        timeZone={timeZone}
        user={user ? `@${user}` : "not signed in"}
      />
    </div>
  );
}
