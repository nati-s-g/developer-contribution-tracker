import "server-only";
import { githubFetchPaginated, type GitHubResponse } from "./client";
import type { GitHubRawCommit } from "@/types/github";
import type { CommitItem } from "@/types/contributions";

/**
 * Normalizes a raw GitHub commit into an application CommitItem.
 */
function toCommitItem(raw: GitHubRawCommit): CommitItem {
  const firstLine =
    raw.commit.message.split("\n")[0]?.trim() || "(no commit message)";
  const authoredAt =
    raw.commit.author?.date ||
    raw.commit.committer?.date ||
    new Date().toISOString();

  return {
    sha: raw.sha,
    shortSha: raw.sha.slice(0, 7),
    message: firstLine,
    authoredAt,
    url: raw.html_url,
  };
}

/**
 * Retrieves the signed-in user's commits for a repository within the specified date range.
 *
 * Query range: `from` at 00:00:00Z through the end of `to` at 23:59:59Z.
 *
 * DESIGN DECISION:
 * We do NOT fetch per-commit additions/deletions stats (`GET /repos/{owner}/{repo}/commits/{sha}`).
 * That would produce an N+1 request per commit, rapidly draining GitHub API rate limits.
 * Pull request statistics already provide accurate diff metrics for reviewed code changes much cheaper.
 *
 * KNOWN LIMITATIONS:
 * 1. Commits match by GitHub account author handle (`author`). If a commit was authored
 *    with a local git email not registered to the user's GitHub account, GitHub will not link it.
 * 2. The commits endpoint inspects the repository's default branch only.
 */
export async function getCommits(
  owner: string,
  repo: string,
  author: string,
  from: string,
  to: string
): Promise<GitHubResponse<CommitItem[]>> {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const cleanAuthor = author.trim();

  const since = `${from}T00:00:00Z`;
  const until = `${to}T23:59:59Z`;

  const result = await githubFetchPaginated<GitHubRawCommit>(
    `/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}/commits`,
    {
      params: {
        author: cleanAuthor,
        since,
        until,
        per_page: 100,
      },
    },
    10 // Bounded at 10 pages (1000 commits max)
  );

  return {
    data: result.data.map(toCommitItem),
    rateLimit: result.rateLimit,
  };
}
