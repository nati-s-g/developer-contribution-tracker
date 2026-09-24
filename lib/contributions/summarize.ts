/**
 * Pure and deterministic contribution metrics summarizer.
 */

import { categorizeContribution } from "./categorize";
import type {
  CommitItem,
  PullRequestSummary,
  IssueItem,
  ReviewItem,
  ContributionSummary,
  ContributionCategory,
} from "@/types/contributions";

export interface ActivityInputs {
  commits: CommitItem[];
  pullRequests: PullRequestSummary[];
  issues: IssueItem[];
  reviews: ReviewItem[];
}

/**
 * Converts an ISO timestamp into a YYYY-MM-DD local date string in the target IANA time zone.
 */
export function getLocalDateString(
  isoString: string,
  timeZone: string
): string | null {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    return isoString.slice(0, 10);
  }
}

/**
 * Computes a ContributionSummary model from raw activity collections.
 * This function is pure and deterministic.
 *
 * @param activity Activity collections for commits, pull requests, issues, and reviews
 * @param timeZone The IANA time zone identifier used for day bucketing (e.g. "Africa/Addis_Ababa", default "UTC")
 */
export function summarizeContributions(
  activity: ActivityInputs,
  timeZone: string = "UTC"
): ContributionSummary {
  const commitsCount = activity.commits.length;
  const pullRequestsCount = activity.pullRequests.length;
  const mergedPullRequestsCount = activity.pullRequests.filter(
    (pr) => pr.merged
  ).length;
  const issuesCount = activity.issues.length;
  const reviewsCount = activity.reviews.length;

  // Additions and deletions from pull requests
  let additions = 0;
  let deletions = 0;
  for (const pr of activity.pullRequests) {
    additions += pr.additions;
    deletions += pr.deletions;
  }

  // Category counts
  const byCategory: Record<ContributionCategory, number> = {
    feature: 0,
    bugfix: 0,
    refactor: 0,
    docs: 0,
    test: 0,
    chore: 0,
    other: 0,
  };

  for (const commit of activity.commits) {
    const cat = categorizeContribution(commit.message);
    byCategory[cat]++;
  }

  for (const pr of activity.pullRequests) {
    const cat = categorizeContribution(pr.title);
    byCategory[cat]++;
  }

  for (const issue of activity.issues) {
    const cat = categorizeContribution(issue.title, issue.labels);
    byCategory[cat]++;
  }

  for (const review of activity.reviews) {
    const cat = categorizeContribution(review.prTitle);
    byCategory[cat]++;
  }

  // Active Days and Activity Extents
  const distinctLocalDays = new Set<string>();
  const validTimestamps: number[] = [];

  function recordTimestamp(isoString: string) {
    if (!isoString) return;
    const time = new Date(isoString).getTime();
    if (!isNaN(time)) {
      validTimestamps.push(time);
      const localDay = getLocalDateString(isoString, timeZone);
      if (localDay) {
        distinctLocalDays.add(localDay);
      }
    }
  }

  activity.commits.forEach((c) => recordTimestamp(c.authoredAt));
  activity.pullRequests.forEach((pr) => recordTimestamp(pr.createdAt));
  activity.issues.forEach((i) => recordTimestamp(i.createdAt));
  activity.reviews.forEach((r) => recordTimestamp(r.submittedAt));

  validTimestamps.sort((a, b) => a - b);

  const firstActivityAt =
    validTimestamps.length > 0
      ? new Date(validTimestamps[0]).toISOString()
      : null;
  const lastActivityAt =
    validTimestamps.length > 0
      ? new Date(validTimestamps[validTimestamps.length - 1]).toISOString()
      : null;

  return {
    commits: commitsCount,
    pullRequests: pullRequestsCount,
    mergedPullRequests: mergedPullRequestsCount,
    issues: issuesCount,
    reviews: reviewsCount,
    activeDays: distinctLocalDays.size,
    additions,
    deletions,
    firstActivityAt,
    lastActivityAt,
    byCategory,
  };
}
