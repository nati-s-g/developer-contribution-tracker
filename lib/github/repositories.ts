import "server-only";
import {
  githubFetch,
  githubFetchPaginated,
  GitHubNotFoundError,
  type GitHubResponse,
} from "@/lib/github/client";
import type { GitHubRawRepository } from "@/types/github";
import type { RepositorySummary } from "@/types/contributions";

/**
 * Normalizes raw GitHub repository data into an application RepositorySummary.
 */
function toRepositorySummary(raw: GitHubRawRepository): RepositorySummary {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    owner: {
      id: raw.owner.id,
      login: raw.owner.login,
      avatarUrl: raw.owner.avatar_url,
    },
    private: raw.private,
    pushedAt: raw.pushed_at,
    description: raw.description,
    defaultBranch: raw.default_branch,
    url: raw.html_url,
  };
}

/**
 * Lists repositories accessible to the authenticated user.
 * Fetches owner, collaborator, and organization_member repositories,
 * sorted by most recently pushed first, 100 per page, capped at 3 pages (300 repos).
 */
export async function listRepositories(): Promise<
  GitHubResponse<RepositorySummary[]>
> {
  const result = await githubFetchPaginated<GitHubRawRepository>(
    "/user/repos",
    {
      params: {
        affiliation: "owner,collaborator,organization_member",
        sort: "pushed",
        direction: "desc",
        per_page: 100,
      },
    },
    3 // Capped at 3 pages (300 repos max)
  );

  return {
    data: result.data.map(toRepositorySummary),
    rateLimit: result.rateLimit,
  };
}

/**
 * Retrieves a single repository by owner and name using the authenticated user's token.
 * Used to confirm repository existence and verify access before running analysis.
 * Returns null if repository does not exist or user lacks access.
 */
export async function getRepository(
  owner: string,
  repo: string
): Promise<GitHubResponse<RepositorySummary | null>> {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();

  try {
    const result = await githubFetch<GitHubRawRepository>(
      `/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}`
    );

    return {
      data: toRepositorySummary(result.data),
      rateLimit: result.rateLimit,
    };
  } catch (error) {
    if (error instanceof GitHubNotFoundError) {
      return {
        data: null,
        rateLimit: error.rateLimit || {
          limit: 0,
          remaining: 0,
          reset: new Date(),
          used: 0,
        },
      };
    }
    throw error;
  }
}
