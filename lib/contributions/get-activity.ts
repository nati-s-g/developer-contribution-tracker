import "server-only";
import { cache } from "react";
import { getCommits, getPullRequests } from "@/lib/github";
import {
  GitHubRateLimitError,
  GitHubUnauthorizedError,
  GitHubNotFoundError,
  GitHubApiError,
} from "@/lib/github/client";
import type {
  CommitItem,
  PullRequestSummary,
  ActivitySourceError,
} from "@/types/contributions";
import type { GitHubRateLimitInfo } from "@/types/github";

export interface RepositoryActivityResult {
  commits: CommitItem[];
  pullRequests: PullRequestSummary[];
  errors: ActivitySourceError[];
  warnings: string[];
  rateLimit?: GitHubRateLimitInfo;
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof GitHubRateLimitError) {
    return error.message;
  }
  if (error instanceof GitHubUnauthorizedError) {
    return "GitHub session or token is invalid. Please sign in again.";
  }
  if (error instanceof GitHubNotFoundError) {
    return "Resource not found or repository access denied.";
  }
  if (error instanceof GitHubApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred while communicating with GitHub.";
}

/**
 * Retrieves repository activity (commits, pull requests) for the specified user and date range.
 *
 * Wrapped in React cache() with primitive arguments so multiple Server Components
 * or dashboard panels can await the exact same result within a single request cycle
 * without duplicate network calls.
 *
 * RESILIENCY GUARANTEE:
 * Executes data sources in parallel via Promise.allSettled. If one data source fails
 * (e.g. Search API rate limiting), the other sources still render, and the failure
 * is reported gracefully in the errors list without failing the entire dashboard.
 */
export const getRepositoryActivity = cache(
  async (
    owner: string,
    repo: string,
    login: string,
    from: string,
    to: string
  ): Promise<RepositoryActivityResult> => {
    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    const cleanLogin = login.trim();
    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    const [commitsSettled, prsSettled] = await Promise.allSettled([
      getCommits(cleanOwner, cleanRepo, cleanLogin, cleanFrom, cleanTo),
      getPullRequests(cleanOwner, cleanRepo, cleanLogin, cleanFrom, cleanTo),
    ]);

    const errors: ActivitySourceError[] = [];
    const warnings: string[] = [];
    let commits: CommitItem[] = [];
    let pullRequests: PullRequestSummary[] = [];
    let rateLimit: GitHubRateLimitInfo | undefined;

    // Handle commits result
    if (commitsSettled.status === "fulfilled") {
      commits = commitsSettled.value.data;
      rateLimit = commitsSettled.value.rateLimit;
    } else {
      errors.push({
        source: "commits",
        message: formatErrorMessage(commitsSettled.reason),
      });
    }

    // Handle pull requests result
    if (prsSettled.status === "fulfilled") {
      pullRequests = prsSettled.value.data;
      warnings.push(...prsSettled.value.warnings);
      // Prefer latest rate limit info
      if (prsSettled.value.rateLimit) {
        rateLimit = prsSettled.value.rateLimit;
      }
    } else {
      errors.push({
        source: "pull-requests",
        message: formatErrorMessage(prsSettled.reason),
      });
    }

    return {
      commits,
      pullRequests,
      errors,
      warnings,
      rateLimit,
    };
  }
);
