"use client";

import * as React from "react";
import { GitFork, Lock, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { RepositorySummary } from "@/types/contributions";
import { cn } from "@/lib/utils";

interface RepositoryPickerProps {
  repositories: RepositorySummary[];
  selectedRepo: string | null;
  onSelect: (repoFullName: string) => void;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function RepositoryPicker({
  repositories,
  selectedRepo,
  onSelect,
  isLoading = false,
  error = null,
  onRefresh,
}: RepositoryPickerProps) {
  const [open, setOpen] = React.useState(false);

  const currentRepo = repositories.find((r) => r.fullName === selectedRepo);

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-[var(--fg-muted)]">
          Repository
        </label>
        <span className="font-mono text-[10px] text-[var(--fg-muted)]">
          {repositories.length} available
        </span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-expanded={open}
              aria-label={
                selectedRepo
                  ? `Selected repository ${selectedRepo}`
                  : "Select repository"
              }
              className={cn(
                "flex h-6 w-full items-center justify-between rounded-[2px] border border-[var(--border)] bg-[var(--bg-editor)] px-2 font-mono text-xs text-[var(--fg)] transition-colors select-none",
                "hover:border-[var(--fg-muted)] hover:bg-[var(--hover)] focus-visible:outline-1 focus-visible:outline-[var(--focus)]",
                open && "border-[var(--focus)]"
              )}
            >
              <div className="flex items-center gap-1.5 truncate">
                {currentRepo?.private ? (
                  <Lock className="size-3 shrink-0 text-[var(--warning)]" />
                ) : (
                  <GitFork className="size-3 shrink-0 text-[var(--link)]" />
                )}
                <span className="truncate">
                  {selectedRepo || "Select repository…"}
                </span>
              </div>
              <span className="font-sans text-[10px] tracking-wider text-[var(--fg-muted)] uppercase">
                {selectedRepo ? "Change" : "None"}
              </span>
            </button>
          }
        />

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-72 max-w-[85vw] rounded-[2px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-0 shadow-2xl"
        >
          <Command className="rounded-[2px] bg-[var(--bg-sidebar)] text-[var(--fg)]">
            <CommandInput
              placeholder="Search repositories…"
              className="font-mono text-xs text-[var(--fg)]"
            />
            <CommandList className="max-h-56 divide-y divide-[var(--border)] font-mono text-xs select-none">
              {isLoading && (
                <div className="p-3 text-center text-xs text-[var(--fg-muted)]">
                  Loading repositories…
                </div>
              )}

              {!isLoading && error && (
                <div className="flex items-center justify-between p-2 text-xs text-[var(--removed)]">
                  <span>{error}</span>
                  {onRefresh && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="ml-2 cursor-pointer text-[10px] text-[var(--link)] hover:underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {!isLoading && !error && (
                <CommandEmpty className="py-4 text-center text-xs text-[var(--fg-muted)]">
                  No repository found.
                </CommandEmpty>
              )}

              {!isLoading && !error && (
                <CommandGroup className="p-0">
                  {repositories.map((repo) => {
                    const isSelected = repo.fullName === selectedRepo;
                    return (
                      <CommandItem
                        key={repo.id}
                        value={repo.fullName}
                        onSelect={() => {
                          onSelect(repo.fullName);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex h-6 cursor-pointer items-center justify-between rounded-none px-2 font-mono text-xs",
                          isSelected
                            ? "bg-[var(--selected)] text-white"
                            : "text-[var(--fg)] hover:bg-[var(--hover)]"
                        )}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {repo.private ? (
                            <Lock className="size-3 shrink-0 text-[var(--warning)]" />
                          ) : (
                            <GitFork className="size-3 shrink-0 text-[var(--fg-muted)]" />
                          )}
                          <span className="truncate">{repo.fullName}</span>
                        </div>
                        {isSelected && (
                          <Check className="ml-auto size-3 text-white" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
