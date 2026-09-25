"use client";

import * as React from "react";
import Link from "next/link";
import { Terminal, PanelLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TitleBarProps {
  onOpenMobileSidebar?: () => void;
  user?: string | null;
}

export function TitleBar({ onOpenMobileSidebar, user = null }: TitleBarProps) {
  return (
    <header className="flex h-[35px] min-h-[35px] w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg-titlebar)] px-2 text-xs select-none">
      {/* Left: Mobile toggle + App Branding */}
      <div className="flex items-center gap-2">
        {onOpenMobileSidebar && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onOpenMobileSidebar}
            aria-label="Open sidebar menu"
            className="flex h-6 w-6 items-center justify-center p-0 text-[var(--fg-muted)] hover:bg-[var(--hover)] hover:text-[var(--fg-strong)] focus-visible:outline-1 focus-visible:outline-[var(--focus)] md:hidden"
          >
            <PanelLeft className="size-4" />
          </Button>
        )}

        <Link
          href="/"
          className="flex items-center gap-1.5 text-[var(--fg-strong)] transition-opacity hover:opacity-85 focus-visible:outline-1 focus-visible:outline-[var(--focus)]"
        >
          <Terminal className="size-3.5 text-[var(--link)]" />
          <span className="font-medium tracking-tight">
            Internship Contribution Tracker
          </span>
        </Link>
      </div>

      {/* Right: User indicator & Sign Out action */}
      <div className="flex items-center gap-3 font-sans">
        <div className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)]">
          <span>github:</span>
          <span className="font-mono text-[var(--fg-strong)]">
            {user ? `@${user}` : "unsigned"}
          </span>
        </div>

        {user ? (
          <form
            action="/api/auth/logout"
            method="POST"
            className="flex items-center"
          >
            <Button
              type="submit"
              variant="ghost"
              size="xs"
              aria-label="Sign out"
              className="h-6 cursor-pointer gap-1.5 rounded-[2px] px-2 font-sans text-xs text-[var(--fg-muted)] hover:bg-[var(--hover)] hover:text-[var(--fg-strong)] focus-visible:outline-1 focus-visible:outline-[var(--focus)]"
            >
              <LogOut className="size-3.5 text-[var(--fg-muted)]" />
              <span>Sign out</span>
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled
            aria-label="Sign out (disabled)"
            className="h-6 cursor-not-allowed gap-1.5 rounded-[2px] px-2 font-sans text-xs text-[var(--fg-muted)] opacity-50 hover:bg-transparent"
          >
            <LogOut className="size-3.5 text-[var(--fg-muted)]" />
            <span>Sign out</span>
          </Button>
        )}
      </div>
    </header>
  );
}
