/**
 * Pure and deterministic contribution timeline generator.
 */

import { categorizeContribution } from "./categorize";
import { getLocalDateString, type ActivityInputs } from "./summarize";
import type { ActivityItem, DayTimelineGroup } from "@/types/contributions";

/**
 * Transforms collections of commits, pull requests, issues, and reviews into
 * a unified list of ActivityItems, sorted newest first, and grouped by local date
 * in the specified time zone.
 *
 * This function is pure and deterministic.
 */
export function buildTimeline(
  activity: ActivityInputs,
  timeZone: string = "UTC"
): DayTimelineGroup[] {
  const items: ActivityItem[] = [];

  // 1. Commits
  for (const commit of activity.commits) {
    items.push({
      kind: "commit",
      id: `commit-${commit.sha}`,
      title: commit.message,
      sha: commit.sha,
      shortSha: commit.shortSha,
      message: commit.message,
      url: commit.url,
      occurredAt: commit.authoredAt,
      category: categorizeContribution(commit.message),
    });
  }

  // 2. Pull Requests
  for (const pr of activity.pullRequests) {
    items.push({
      kind: "pull_request",
      id: `pr-${pr.number}`,
      title: pr.title,
      number: pr.number,
      state: pr.state,
      draft: pr.draft,
      merged: pr.merged,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changedFiles,
      url: pr.url,
      occurredAt: pr.createdAt,
      category: categorizeContribution(pr.title),
    });
  }

  // 3. Issues
  for (const issue of activity.issues) {
    items.push({
      kind: "issue",
      id: `issue-${issue.number}`,
      title: issue.title,
      number: issue.number,
      state: issue.state,
      labels: issue.labels,
      url: issue.url,
      occurredAt: issue.createdAt,
      category: categorizeContribution(issue.title, issue.labels),
    });
  }

  // 4. Reviews
  for (const review of activity.reviews) {
    items.push({
      kind: "review",
      id: `review-${review.id}`,
      title: `Reviewed #${review.prNumber}: ${review.prTitle}`,
      prNumber: review.prNumber,
      prTitle: review.prTitle,
      state: review.state,
      url: review.prUrl,
      occurredAt: review.submittedAt,
      category: categorizeContribution(review.prTitle),
    });
  }

  // Sort descending by timestamp (newest first)
  items.sort((a, b) => {
    const timeA = new Date(a.occurredAt).getTime();
    const timeB = new Date(b.occurredAt).getTime();
    return timeB - timeA;
  });

  // Group by local calendar date in the target time zone
  const groupsMap = new Map<string, ActivityItem[]>();

  for (const item of items) {
    const localDate =
      getLocalDateString(item.occurredAt, timeZone) || "unknown";
    const existing = groupsMap.get(localDate);
    if (existing) {
      existing.push(item);
    } else {
      groupsMap.set(localDate, [item]);
    }
  }

  return Array.from(groupsMap.entries()).map(([date, groupItems]) => ({
    date,
    items: groupItems,
  }));
}
