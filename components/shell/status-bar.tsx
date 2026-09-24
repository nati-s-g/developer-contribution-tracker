import * as React from "react";

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
      className="flex h-[22px] min-h-[22px] w-full items-center justify-between bg-[var(--bg-status)] px-2 font-mono text-[11px] text-white select-none"
    >
      {/* Left side items */}
      <div className="flex items-center gap-2 truncate overflow-hidden">
        <span className="truncate">repo: {repo}</span>
        <span className="opacity-60" aria-hidden="true">
          ·
        </span>
        <span className="shrink-0">range: {range}</span>
        <span className="opacity-60" aria-hidden="true">
          ·
        </span>
        <span className="shrink-0">tz: {timeZone}</span>
      </div>

      {/* Right side item */}
      <div className="shrink-0 pl-2">
        <span>user: {user}</span>
      </div>
    </footer>
  );
}
