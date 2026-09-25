import * as React from "react";
import { GitBranch } from "lucide-react";

interface StatusBarProps {
  repo?: string;
  range?: string;
  timeZone?: string;
  user?: string;
}

export function StatusBar({
  repo = "none selected",
  range = "--",
  timeZone = "UTC",
  user = "not signed in",
}: StatusBarProps) {
  return (
    <footer
      aria-label="Application Status"
      className="flex h-[22px] min-h-[22px] w-full items-center justify-between bg-[var(--bg-status)] px-2.5 font-sans text-[11px] text-white select-none"
    >
      {/* Left side items */}
      <div className="flex items-center gap-2 truncate overflow-hidden">
        <div className="flex items-center gap-1 truncate">
          <GitBranch className="size-3 shrink-0 text-white/80" />
          <span className="truncate font-mono">{repo}</span>
        </div>
        <span className="opacity-60" aria-hidden="true">
          ·
        </span>
        <span className="shrink-0">{range}</span>
        <span className="opacity-60" aria-hidden="true">
          ·
        </span>
        <span className="shrink-0">{timeZone}</span>
      </div>

      {/* Right side item */}
      <div className="shrink-0 pl-2">
        <span>{user}</span>
      </div>
    </footer>
  );
}
