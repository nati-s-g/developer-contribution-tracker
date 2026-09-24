/**
 * Application-level Normalized Domain Types
 * Decouples application and UI layers from raw GitHub API schemas.
 */

export interface RepositoryOwner {
  id: number;
  login: string;
  avatarUrl: string;
}

export interface RepositorySummary {
  id: number;
  owner: RepositoryOwner;
  name: string;
  fullName: string; // e.g. "owner/repo"
  private: boolean;
  pushedAt: string | null;
  description: string | null;
  defaultBranch?: string;
  url?: string;
}

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  timeZone: string; // IANA time zone, e.g. "UTC"
}

export interface AnalysisContext {
  repository: RepositorySummary | null;
  dateRange: DateRange;
  daysCount: number;
  isValid: boolean;
  validationError?: string;
}

export interface CommitItem {
  sha: string;
  shortSha: string;
  message: string; // first line of the commit message
  authoredAt: string; // ISO 8601
  url: string;
}

export type PullRequestState = "open" | "closed" | "merged";

export interface PullRequestSummary {
  number: number;
  title: string;
  state: PullRequestState;
  draft: boolean;
  merged: boolean;
  mergedAt: string | null;
  createdAt: string;
  updatedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  excerpt: string; // first ~300 characters of body
  url: string;
}

export interface IssueItem {
  number: number;
  title: string;
  state: "open" | "closed";
  createdAt: string;
  closedAt: string | null;
  labels: string[];
  url: string;
}

export interface ReviewItem {
  id: number;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  state: string; // APPROVED, CHANGES_REQUESTED, COMMENTED, DISMISSED
  submittedAt: string;
}

export type ContributionCategory =
  "feature" | "bugfix" | "refactor" | "docs" | "test" | "chore" | "other";

export type ActivityKind = "commit" | "pull_request" | "issue" | "review";

interface BaseActivityItem {
  id: string;
  title: string;
  url: string;
  occurredAt: string; // ISO 8601
  category: ContributionCategory;
}

export interface CommitActivityItem extends BaseActivityItem {
  kind: "commit";
  sha: string;
  shortSha: string;
  message: string;
}

export interface PullRequestActivityItem extends BaseActivityItem {
  kind: "pull_request";
  number: number;
  state: PullRequestState;
  draft: boolean;
  merged: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface IssueActivityItem extends BaseActivityItem {
  kind: "issue";
  number: number;
  state: "open" | "closed";
  labels: string[];
}

export interface ReviewActivityItem extends BaseActivityItem {
  kind: "review";
  prNumber: number;
  prTitle: string;
  state: string;
}

export type ActivityItem =
  | CommitActivityItem
  | PullRequestActivityItem
  | IssueActivityItem
  | ReviewActivityItem;

export interface DayTimelineGroup {
  date: string; // YYYY-MM-DD in user's time zone
  items: ActivityItem[];
}

export interface ContributionSummary {
  commits: number;
  pullRequests: number;
  mergedPullRequests: number;
  issues: number;
  reviews: number;
  activeDays: number;
  additions: number;
  deletions: number;
  firstActivityAt: string | null;
  lastActivityAt: string | null;
  byCategory: Record<ContributionCategory, number>;
}

export interface ActivitySourceError {
  source:
    | "commits"
    | "pull-requests"
    | "issues"
    | "reviews"
    | "repositories"
    | "general";
  message: string;
  status?: number;
  resetTime?: Date;
}

export interface RepositoryActivity {
  commits: CommitItem[];
  pullRequests: PullRequestSummary[];
  issues: IssueItem[];
  reviews: ReviewItem[];
  errors: ActivitySourceError[];
  warnings: string[];
}
