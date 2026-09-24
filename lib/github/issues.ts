import "server-only";
import { githubFetch, type GitHubResponse } from "./client";
import type {
  GitHubSearchIssueItem,
  GitHubSearchResult,
  GitHubRateLimitInfo,
} from "@/types/github";
import type { IssueItem } from "@/types/contributions";

export interface IssuesFetchResult {
  data: IssueItem[];
  warnings: string[];
  rateLimit: GitHubRateLimitInfo;
}

/**
 * Normalizes a raw GitHub search issue into an application IssueItem.
 */
function toIssueItem(raw: GitHubSearchIssueItem): IssueItem {
  const labels = Array.isArray(raw.labels)
    ? raw.labels
        .map((label) => (typeof label === "string" ? label : label.name || ""))
        .filter(Boolean)
    : [];

  return {
    number: raw.number,
    title: raw.title,
    state: raw.state === "closed" ? "closed" : "open",
    createdAt: raw.created_at,
    closedAt: raw.closed_at || null,
    labels,
    url: raw.html_url,
  };
}

/**
 * Retrieves issues opened by the authenticated user in the specified repository and date range.
 *
 * Query: `repo:{owner}/{repo} is:issue author:{login} created:{from}..{to}`
 *
 * KNOWN LIMITATIONS:
 * 1. GitHub Search API caps any query at 1,000 results. If the user opened >1,000 issues,
 *    a warning is surfaced.
 * 2. Search API rate limit is 30 requests/minute for authenticated users.
 */
export async function getIssues(
  owner: string,
  repo: string,
  author: string,
  from: string,
  to: string
): Promise<IssuesFetchResult> {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const cleanAuthor = author.trim();
  const warnings: string[] = [];
  const items: GitHubSearchIssueItem[] = [];

  const query = `repo:${cleanOwner}/${cleanRepo} is:issue author:${cleanAuthor} created:${from}..${to}`;

  let page = 1;
  let hasMore = true;
  let latestRateLimit: GitHubRateLimitInfo = {
    limit: 0,
    remaining: 0,
    reset: new Date(),
    used: 0,
  };

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
      if (
        !warnings.includes(
          "Issue search hit GitHub's 1,000 result cap; some issues may be omitted."
        )
      ) {
        warnings.push(
          "Issue search hit GitHub's 1,000 result cap; some issues may be omitted."
        );
      }
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

  const issueItems = items.map(toIssueItem);

  // Sort descending by created date (newest first)
  issueItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    data: issueItems,
    warnings,
    rateLimit: latestRateLimit,
  };
}
