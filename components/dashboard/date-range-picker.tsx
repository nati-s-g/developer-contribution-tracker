"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateRangePickerProps {
  initialFrom?: string;
  initialTo?: string;
  initialTimeZone?: string;
  hasRepository: boolean;
  onApply: (from: string, to: string, timeZone: string) => void;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateRangePicker({
  initialFrom,
  initialTo,
  initialTimeZone,
  hasRepository,
  onApply,
}: DateRangePickerProps) {
  // Compute default dates
  const defaultTo = React.useMemo(() => formatDate(new Date()), []);
  const defaultFrom = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDate(d);
  }, []);

  const [from, setFrom] = React.useState(initialFrom || defaultFrom);
  const [to, setTo] = React.useState(initialTo || defaultTo);

  const getTimeZone = React.useCallback((): string => {
    if (initialTimeZone) return initialTimeZone;
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, [initialTimeZone]);

  // Validation
  const validationError = React.useMemo(() => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!from || !dateRegex.test(from)) {
      return "Start date must be in YYYY-MM-DD format.";
    }
    if (!to || !dateRegex.test(to)) {
      return "End date must be in YYYY-MM-DD format.";
    }
    if (from > to) {
      return "End date cannot be earlier than start date.";
    }

    const todayStr = formatDate(new Date());
    if (to > todayStr) {
      return "End date cannot be in the future.";
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffDays = Math.round(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 366) {
      return "Analysis date range cannot exceed 366 days.";
    }

    return null;
  }, [from, to]);

  const isValid = validationError === null;

  // Preset Handlers
  const handlePresetDays = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setFrom(formatDate(start));
    setTo(formatDate(end));
  };

  const handleThisYear = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), 0, 1);
    setFrom(formatDate(start));
    setTo(formatDate(end));
  };

  // Submit Handler: Only triggers navigation when clicked
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && hasRepository) {
      onApply(from, to, getTimeZone());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 select-none">
      {/* From Input (Native date input styled with tokens) */}
      <div className="space-y-1">
        <label
          htmlFor="range-date-from"
          className="text-[11px] font-medium text-[var(--fg-muted)]"
        >
          From
        </label>
        <Input
          id="range-date-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          max={formatDate(new Date())}
          aria-invalid={!isValid}
          className="h-8 px-2.5 text-xs [color-scheme:dark]"
        />
      </div>

      {/* To Input (Native date input styled with tokens) */}
      <div className="space-y-1">
        <label
          htmlFor="range-date-to"
          className="text-xs font-medium text-[var(--fg-muted)]"
        >
          To
        </label>
        <Input
          id="range-date-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          max={formatDate(new Date())}
          aria-invalid={!isValid}
          className="h-8 px-2.5 text-xs [color-scheme:dark]"
        />
      </div>

      {/* Validation Feedback */}
      {validationError && (
        <div
          role="alert"
          className="flex items-center gap-1 text-[11px] text-[var(--removed)]"
        >
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Presets: Last 30 days, Last 90 days, This year */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
          Presets
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handlePresetDays(30)}
            className="h-6 rounded-[2px] border border-[var(--border)] bg-[var(--bg-editor)] px-2.5 font-mono text-[11px] text-[var(--fg-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--fg-strong)]"
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => handlePresetDays(90)}
            className="h-6 rounded-[2px] border border-[var(--border)] bg-[var(--bg-editor)] px-2.5 font-mono text-[11px] text-[var(--fg-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--fg-strong)]"
          >
            Last 90 days
          </button>
          <button
            type="button"
            onClick={handleThisYear}
            className="h-6 rounded-[2px] border border-[var(--border)] bg-[var(--bg-editor)] px-2.5 font-mono text-[11px] text-[var(--fg-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--fg-strong)]"
          >
            This year
          </button>
        </div>
      </div>

      {/* Load activity button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={!isValid || !hasRepository}
          className="h-8 w-full cursor-pointer rounded-[2px] bg-[var(--accent)] px-3 text-xs font-semibold text-white transition-opacity hover:bg-[var(--accent)]/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Load activity
        </Button>
        {!hasRepository && (
          <p className="mt-1 text-center text-[10px] text-[var(--fg-muted)]">
            Select a repository, then Load activity
          </p>
        )}
      </div>
    </form>
  );
}
