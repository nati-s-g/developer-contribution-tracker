import "server-only";
import { cache } from "react";
import {
  getCommits,
  getPullRequests,
  getIssues,
  getReviews,
} from "@/lib/github";
import {
  GitHubRateLimitError,
  GitHubUnauthorizedError,
  GitHubNotFoundError,
  GitHubApiError,
} from "@/lib/github/client";
import type {
  CommitItem,
  PullRequestSummary,
  IssueItem,
  ReviewItem,
  ActivitySourceError,
} from "@/types/contributions";
import type { GitHubRateLimitInfo } from "@/types/github";

export interface RepositoryActivityResult {
  commits: CommitItem[];
  pullRequests: PullRequestSummary[];
  issues: IssueItem[];
  reviews: ReviewItem[];
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
 * Retrieves repository activity (commits, pull requests, issues, reviews)
 * for the specified user and date range.
 *
 * Wrapped in React cache() with primitive arguments so multiple Server Components
 * or dashboard panels can await the exact same result within a single request cycle
 * without duplicate network calls.
 *
 * RESILIENCY GUARANTEE:
 * Executes all data sources in parallel via Promise.allSettled. If one data source fails
 * (e.g. Search API rate limiting on reviews), the other sources still render, and the failure
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

    const [commitsSettled, prsSettled, issuesSettled, reviewsSettled] =
      await Promise.allSettled([
        getCommits(cleanOwner, cleanRepo, cleanLogin, cleanFrom, cleanTo),
        getPullRequests(cleanOwner, cleanRepo, cleanLogin, cleanFrom, cleanTo),
        getIssues(cleanOwner, cleanRepo, cleanLogin, cleanFrom, cleanTo),
        getReviews(cleanOwner, cleanRepo, cleanLogin, cleanFrom, cleanTo),
      ]);

    const errors: ActivitySourceError[] = [];
    const warnings: string[] = [];
    let commits: CommitItem[] = [];
    let pullRequests: PullRequestSummary[] = [];
    let issues: IssueItem[] = [];
    let reviews: ReviewItem[] = [];
    let rateLimit: GitHubRateLimitInfo | undefined;

    // 1. Commits
    if (commitsSettled.status === "fulfilled") {
      commits = commitsSettled.value.data;
      rateLimit = commitsSettled.value.rateLimit;
    } else {
      errors.push({
        source: "commits",
        message: formatErrorMessage(commitsSettled.reason),
      });
    }

    // 2. Pull Requests
    if (prsSettled.status === "fulfilled") {
      pullRequests = prsSettled.value.data;
      warnings.push(...prsSettled.value.warnings);
      if (prsSettled.value.rateLimit) {
        rateLimit = prsSettled.value.rateLimit;
      }
    } else {
      errors.push({
        source: "pull-requests",
        message: formatErrorMessage(prsSettled.reason),
      });
    }

    // 3. Issues
    if (issuesSettled.status === "fulfilled") {
      issues = issuesSettled.value.data;
      warnings.push(...issuesSettled.value.warnings);
      if (issuesSettled.value.rateLimit) {
        rateLimit = issuesSettled.value.rateLimit;
      }
    } else {
      errors.push({
        source: "issues",
        message: formatErrorMessage(issuesSettled.reason),
      });
    }

    // 4. Reviews
    if (reviewsSettled.status === "fulfilled") {
      reviews = reviewsSettled.value.data;
      warnings.push(...reviewsSettled.value.warnings);
      if (reviewsSettled.value.rateLimit) {
        rateLimit = reviewsSettled.value.rateLimit;
      }
    } else {
      errors.push({
        source: "reviews",
        message: formatErrorMessage(reviewsSettled.reason),
      });
    }

    return {
      commits,
      pullRequests,
      issues,
      reviews,
      errors,
      warnings,
      rateLimit,
    };
  }
);
