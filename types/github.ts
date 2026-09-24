/**
 * Raw GitHub REST API v3 Response Types
 * Only includes fields directly utilized by the application.
 */

export interface GitHubRawOwner {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRawRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubRawOwner;
  description: string | null;
  html_url: string;
  pushed_at: string | null;
  updated_at: string;
  default_branch: string;
}

export interface GitHubRateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

export interface GitHubRawCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    } | null;
    committer: {
      name: string;
      email: string;
      date: string;
    } | null;
  };
  author: GitHubRawOwner | null;
}

export interface GitHubSearchIssueItem {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: {
    url: string;
    html_url: string;
    merged_at?: string | null;
  };
  body?: string | null;
  draft?: boolean;
  user?: GitHubRawOwner | null;
  labels?: Array<{ id?: number; name?: string; color?: string } | string>;
}

export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface GitHubRawPullRequest {
  number: number;
  title: string;
  state: string;
  draft?: boolean;
  merged?: boolean;
  merged_at?: string | null;
  created_at: string;
  updated_at: string;
  body?: string | null;
  html_url: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  user?: GitHubRawOwner | null;
}

export interface GitHubRawReview {
  id: number;
  user: GitHubRawOwner | null;
  body: string | null;
  state: string;
  html_url: string;
  submitted_at: string | null;
  commit_id: string;
}
