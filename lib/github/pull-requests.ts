import "server-only";
import { githubFetch, type GitHubResponse } from "./client";
import { mapWithConcurrency } from "@/lib/utils/concurrency";
import type {
  GitHubSearchIssueItem,
  GitHubSearchResult,
  GitHubRawPullRequest,
  GitHubRateLimitInfo,
} from "@/types/github";
import type {
  PullRequestSummary,
  PullRequestState,
} from "@/types/contributions";

export interface PullRequestsFetchResult {
  data: PullRequestSummary[];
  warnings: string[];
  rateLimit: GitHubRateLimitInfo;
}

/**
 * Normalizes raw GitHub PR details into an application PullRequestSummary.
 */
function toPullRequestSummary(raw: GitHubRawPullRequest): PullRequestSummary {
  let state: PullRequestState = "open";
  if (raw.merged) {
    state = "merged";
  } else if (raw.state === "closed") {
    state = "closed";
  }

  // Extract clean excerpt from body: collapse whitespace, trim to ~300 chars
  const cleanExcerpt = raw.body
    ? raw.body
        .replace(/\r?\n+/g, " ")
        .trim()
        .slice(0, 300)
    : "";

  return {
    number: raw.number,
    title: raw.title,
    state,
    draft: Boolean(raw.draft),
    merged: Boolean(raw.merged),
    mergedAt: raw.merged_at || null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    additions: raw.additions ?? 0,
    deletions: raw.deletions ?? 0,
    changedFiles: raw.changed_files ?? 0,
    excerpt: cleanExcerpt,
    url: raw.html_url,
  };
}

/**
 * Executes a single paginated GitHub search query up to the 1000 item cap.
 */
async function searchPullRequests(query: string): Promise<{
  items: GitHubSearchIssueItem[];
  hitCap: boolean;
  rateLimit: GitHubRateLimitInfo;
}> {
  const items: GitHubSearchIssueItem[] = [];
  let page = 1;
  let hasMore = true;
  let hitCap = false;
  let latestRateLimit: GitHubRateLimitInfo = {
    limit: 0,
    remaining: 0,
    reset: new Date(),
    used: 0,
  };

  // GitHub Search API limits results to at most 1,000 items (10 pages of 100)
  while (hasMore && page <= 10) {
    const res: GitHubResponse<GitHubSearchResult<GitHubSearchIssueItem>> =
      await githubFetch<GitHubSearchResult<GitHubSearchIssueItem>>(
        "/search/issues",
        {
          params: {
            q: query,
            per_page: 100,
            page,
          },
        }
      );

    latestRateLimit = res.rateLimit;
    const searchData = res.data;

    if (searchData.total_count > 1000 || searchData.incomplete_results) {
      hitCap = true;
    }

    if (searchData.items && searchData.items.length > 0) {
      items.push(...searchData.items);
    }

    if (
      !searchData.items ||
      searchData.items.length < 100 ||
      items.length >= searchData.total_count
    ) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return { items, hitCap, rateLimit: latestRateLimit };
}

/**
 * Retrieves the signed-in user's pull requests for a repository within the specified date range.
 *
 * DESIGN DECISIONS & ARCHITECTURE:
 * 1. Why Search API? The standard `/repos/{owner}/{repo}/pulls` endpoint cannot filter by author
 *    or date range. Paginating all repository PRs to filter locally would be prohibitively slow and expensive.
 *    Instead, we use `GET /search/issues` with structured filters.
 * 2. Two Queries:
 *    - `created:{from}..{to}`: PRs opened in the date range.
 *    - `merged:{from}..{to}`: PRs merged in the date range (even if created earlier).
 *    We union results by PR number to avoid duplicates.
 * 3. N+1 Detail Resolution: Search API results lack code addition/deletion statistics.
 *    We fetch PR details with `GET /repos/{owner}/{repo}/pulls/{number}` constrained
 *    by `mapWithConcurrency(prNumbers, 5)` to avoid triggering GitHub's secondary abuse limits.
 *
 * KNOWN LIMITATIONS:
 * 1. GitHub Search API caps any query at 1,000 results. If a user exceeds 1,000 PRs in a window,
 *    a warning is surfaced.
 * 2. Search API has a stricter rate limit (30 req/min for authenticated users) than core REST (5,000 req/hr).
 */
export async function getPullRequests(
  owner: string,
  repo: string,
  author: string,
  from: string,
  to: string
): Promise<PullRequestsFetchResult> {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const cleanAuthor = author.trim();
  const warnings: string[] = [];

  // Query 1: Created in range
  const createdQuery = `repo:${cleanOwner}/${cleanRepo} is:pr author:${cleanAuthor} created:${from}..${to}`;
  // Query 2: Merged in range
  const mergedQuery = `repo:${cleanOwner}/${cleanRepo} is:pr author:${cleanAuthor} merged:${from}..${to}`;

  // Execute both search queries in parallel
  const [createdResult, mergedResult] = await Promise.all([
    searchPullRequests(createdQuery),
    searchPullRequests(mergedQuery),
  ]);

  if (createdResult.hitCap || mergedResult.hitCap) {
    warnings.push(
      "PR search hit GitHub's 1,000 result cap; some pull requests in this date range may be omitted."
    );
  }

  // Deduplicate by PR number
  const uniquePrNumbers = new Set<number>();
  createdResult.items.forEach((item) => uniquePrNumbers.add(item.number));
  mergedResult.items.forEach((item) => uniquePrNumbers.add(item.number));

  const prNumberList = Array.from(uniquePrNumbers);

  // If no PRs found, return early
  if (prNumberList.length === 0) {
    return {
      data: [],
      warnings,
      rateLimit: mergedResult.rateLimit || createdResult.rateLimit,
    };
  }

  // Fetch individual PR details with bounded concurrency (limit = 5)
  let latestRateLimit = mergedResult.rateLimit;

  const pullRequestSummaries = await mapWithConcurrency(
    prNumberList,
    5,
    async (prNumber) => {
      const res = await githubFetch<GitHubRawPullRequest>(
        `/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/pulls/${prNumber}`
      );
      latestRateLimit = res.rateLimit;
      return toPullRequestSummary(res.data);
    }
  );

  // Sort descending by created date (most recent first)
  pullRequestSummaries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    data: pullRequestSummaries,
    warnings,
    rateLimit: latestRateLimit,
  };
}
