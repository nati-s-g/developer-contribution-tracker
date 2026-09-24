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

export interface ActivitySourceError {
  source: "commits" | "pull-requests" | "repositories" | "general";
  message: string;
  status?: number;
  resetTime?: Date;
}

export interface RepositoryActivity {
  commits: CommitItem[];
  pullRequests: PullRequestSummary[];
  errors: ActivitySourceError[];
  warnings: string[];
}
