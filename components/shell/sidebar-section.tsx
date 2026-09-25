"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function SidebarSection({
  title,
  children,
  defaultOpen = true,
  className,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("border-b border-[var(--border)]", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left font-sans text-[11px] font-bold tracking-wider text-[var(--fg-muted)] uppercase transition-colors select-none hover:bg-[var(--hover)] hover:text-[var(--fg-strong)] focus-visible:outline-1 focus-visible:outline-[var(--focus)]"
      >
        {isOpen ? (
          <ChevronDown className="size-3.5 shrink-0 text-[var(--fg-muted)]" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-[var(--fg-muted)]" />
        )}
        <span className="truncate">{title}</span>
      </button>
      {isOpen && <div className="space-y-2 p-3 pt-1">{children}</div>}
    </div>
  );
}
