"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LogIn } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  React.useEffect(() => {
    // Log error to console for debugging
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  const message = error.message || "An unexpected error occurred.";
  const isUnauthorized =
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("session") ||
    message.toLowerCase().includes("401");
  const isRateLimit =
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("403") ||
    message.toLowerCase().includes("429");
  const isNotFound =
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("404");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-editor)] p-6 text-[var(--fg)]">
      <div className="w-full max-w-lg space-y-4 border border-[var(--border)] bg-[var(--bg-sidebar)] p-6 font-sans">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 font-sans text-xs font-semibold tracking-wider text-[var(--removed)] uppercase">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            {isUnauthorized
              ? "Session Expired"
              : isRateLimit
                ? "Rate Limit Exceeded"
                : isNotFound
                  ? "Repository Not Found"
                  : "Application Error"}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <p className="font-sans text-[var(--fg-strong)]">{message}</p>

          {isUnauthorized && (
            <p className="text-[var(--fg-muted)]">
              Your GitHub session has expired or the token is no longer valid.
              Please sign in again to re-authenticate with GitHub.
            </p>
          )}

          {isRateLimit && (
            <p className="text-[var(--fg-muted)]">
              GitHub API rate limit was reached. Please wait until the reset
              time indicated above before trying again.
            </p>
          )}

          {isNotFound && (
            <p className="text-[var(--fg-muted)]">
              The requested repository could not be located, or your GitHub
              account does not have permission to view it.
            </p>
          )}

          {error.digest && (
            <div className="font-mono text-[10px] text-[var(--fg-muted)]">
              Error Digest: {error.digest}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
          {isUnauthorized ? (
            <a
              href="/api/auth/github"
              className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            >
              <LogIn className="size-3.5" />
              <span>Sign in again</span>
            </a>
          ) : (
            <Button onClick={() => reset()} size="sm" className="gap-2">
              <RefreshCw className="size-3.5" />
              <span>Try again</span>
            </Button>
          )}

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2"
            )}
          >
            <span>Back to Welcome</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
