import "server-only";
import {
  githubFetch,
  githubFetchPaginated,
  type GitHubResponse,
} from "./client";
import { mapWithConcurrency } from "@/lib/utils/concurrency";
import type {
  GitHubSearchIssueItem,
  GitHubSearchResult,
  GitHubRawReview,
  GitHubRateLimitInfo,
} from "@/types/github";
import type { ReviewItem } from "@/types/contributions";

export interface ReviewsFetchResult {
  data: ReviewItem[];
  warnings: string[];
  rateLimit: GitHubRateLimitInfo;
}

/**
 * Retrieves pull request reviews submitted by the authenticated user in the specified repository and date range.
 *
 * PIPELINE:
 * 1. Discover candidate PRs using the Search API:
 *    `repo:{owner}/{repo} is:pr reviewed-by:{login} updated:>={from} -author:{login}`
 *    Excludes PRs authored by the user.
 * 2. Cap candidate PRs at ~100 to avoid runaway review iteration; warn if capped.
 * 3. Call `GET /repos/{owner}/{repo}/pulls/{number}/reviews` for each candidate PR
 *    bounded with `mapWithConcurrency(prs, 5)`.
 * 4. Filter reviews: keep only reviews submitted by the user whose `submitted_at`
 *    falls between `from` at 00:00:00Z and `to` at 23:59:59Z.
 *    Counts submitted reviews only (approved, changes requested, commented),
 *    NOT raw inline diff comments.
 */
export async function getReviews(
  owner: string,
  repo: string,
  author: string,
  from: string,
  to: string
): Promise<ReviewsFetchResult> {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const cleanAuthor = author.trim();
  const warnings: string[] = [];

  const since = `${from}T00:00:00Z`;
  const until = `${to}T23:59:59Z`;

  let latestRateLimit: GitHubRateLimitInfo = {
    limit: 0,
    remaining: 0,
    reset: new Date(),
    used: 0,
  };

  // Step 1: Find candidate PRs where user was a reviewer, updated >= from, excluding self-authored
  const query = `repo:${cleanOwner}/${cleanRepo} is:pr reviewed-by:${cleanAuthor} updated:>=${from} -author:${cleanAuthor}`;

  const searchRes: GitHubResponse<GitHubSearchResult<GitHubSearchIssueItem>> =
    await githubFetch<GitHubSearchResult<GitHubSearchIssueItem>>(
      "/search/issues",
      {
        params: {
          q: query,
          per_page: 100,
          page: 1,
        },
      }
    );

  latestRateLimit = searchRes.rateLimit;
  let candidatePrs = searchRes.data.items || [];

  // Exclude self-authored PRs if any slip past query
  candidatePrs = candidatePrs.filter(
    (pr) => pr.user?.login?.toLowerCase() !== cleanAuthor.toLowerCase()
  );

  // Cap candidates at 100 PRs to bound secondary rate limits
  if (searchRes.data.total_count > 100 || candidatePrs.length > 100) {
    candidatePrs = candidatePrs.slice(0, 100);
    warnings.push(
      "Review search returned more than 100 candidate pull requests; inspecting the 100 most recent for submitted reviews."
    );
  }

  if (candidatePrs.length === 0) {
    return {
      data: [],
      warnings,
      rateLimit: latestRateLimit,
    };
  }

  // Step 2: For each candidate PR, fetch reviews and filter by user & date range
  const reviewsByPr = await mapWithConcurrency(candidatePrs, 5, async (pr) => {
    try {
      const reviewsRes = await githubFetchPaginated<GitHubRawReview>(
        `/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/pulls/${pr.number}/reviews`,
        {
          params: {
            per_page: 100,
          },
        },
        3 // Capped at 3 pages of reviews per PR
      );

      latestRateLimit = reviewsRes.rateLimit;

      const matchedReviews: ReviewItem[] = [];

      for (const review of reviewsRes.data) {
        // Verify author
        if (review.user?.login?.toLowerCase() !== cleanAuthor.toLowerCase()) {
          continue;
        }

        // Must be a submitted review with timestamp
        if (!review.submitted_at) {
          continue;
        }

        // Check if submitted_at falls inside date window
        if (review.submitted_at >= since && review.submitted_at <= until) {
          matchedReviews.push({
            id: review.id,
            prNumber: pr.number,
            prTitle: pr.title,
            prUrl: pr.html_url,
            state: review.state,
            submittedAt: review.submitted_at,
          });
        }
      }

      return matchedReviews;
    } catch {
      // If one PR's reviews fail to fetch, return empty array for that PR rather than failing all reviews
      return [];
    }
  });

  const allReviews = reviewsByPr.flat();

  // Sort descending by submitted date (newest first)
  allReviews.sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return {
    data: allReviews,
    warnings,
    rateLimit: latestRateLimit,
  };
}
