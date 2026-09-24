import "server-only";
import { getGitHubToken } from "@/lib/auth";
import type { GitHubRateLimitInfo } from "@/types/github";

export const GITHUB_API_BASE = "https://api.github.com";
export const GITHUB_API_VERSION = "2022-11-28";

/* =========================================================================
   TYPED GITHUB API ERRORS
   ========================================================================= */

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly rateLimit?: GitHubRateLimitInfo
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export class GitHubUnauthorizedError extends GitHubApiError {
  constructor(
    message = "GitHub session or token is no longer valid. Please sign in again."
  ) {
    super(message, 401);
    this.name = "GitHubUnauthorizedError";
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  constructor(
    message: string,
    public readonly resetTime: Date,
    rateLimit?: GitHubRateLimitInfo
  ) {
    super(message, 403, rateLimit);
    this.name = "GitHubRateLimitError";
  }
}

export class GitHubNotFoundError extends GitHubApiError {
  constructor(
    message = "Repository or resource was not found or is not accessible."
  ) {
    super(message, 404);
    this.name = "GitHubNotFoundError";
  }
}

/* =========================================================================
   RATE LIMIT & RESPONSE UTILITIES
   ========================================================================= */

export interface GitHubResponse<T> {
  data: T;
  rateLimit: GitHubRateLimitInfo;
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

function parseRateLimit(headers: Headers): GitHubRateLimitInfo {
  const limit = parseInt(headers.get("x-ratelimit-limit") || "0", 10);
  const remaining = parseInt(headers.get("x-ratelimit-remaining") || "0", 10);
  const resetEpoch = parseInt(headers.get("x-ratelimit-reset") || "0", 10);
  const reset = resetEpoch
    ? new Date(resetEpoch * 1000)
    : new Date(Date.now() + 60000);
  const used = Math.max(0, limit - remaining);

  return { limit, remaining, reset, used };
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/i);
  return match ? match[1] : null;
}

/* =========================================================================
   CORE FETCH CLIENT
   ========================================================================= */

/**
 * Thin fetch wrapper for the GitHub REST API v3.
 * Automatically injects the authenticated session token and current API version.
 * Returns both typed data and latest rate-limit telemetry.
 */
export async function githubFetch<T>(
  endpointOrUrl: string,
  options: FetchOptions = {}
): Promise<GitHubResponse<T>> {
  const token = await getGitHubToken();

  const url = endpointOrUrl.startsWith("http")
    ? new URL(endpointOrUrl)
    : new URL(
        `${GITHUB_API_BASE}${endpointOrUrl.startsWith("/") ? "" : "/"}${endpointOrUrl}`
      );

  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": "Internship-Contribution-Tracker",
      ...options.headers,
    },
    cache: "no-store",
  });

  const rateLimit = parseRateLimit(response.headers);
  const retryAfter = response.headers.get("retry-after");

  // Handle 401 Unauthorized
  if (response.status === 401) {
    throw new GitHubUnauthorizedError();
  }

  // Handle Rate Limiting (403 or 429)
  if (
    (response.status === 403 || response.status === 429) &&
    (rateLimit.remaining === 0 || retryAfter !== null)
  ) {
    const resetTime = retryAfter
      ? new Date(Date.now() + parseInt(retryAfter, 10) * 1000)
      : rateLimit.reset;

    const formattedTime = resetTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    throw new GitHubRateLimitError(
      `GitHub API rate limit exceeded. Resets at ${formattedTime}.`,
      resetTime,
      rateLimit
    );
  }

  // Handle 404 Not Found
  if (response.status === 404) {
    throw new GitHubNotFoundError();
  }

  // Handle generic HTTP errors
  if (!response.ok) {
    let errorMessage = `GitHub request failed with status ${response.status}.`;
    try {
      const errorJson = await response.json();
      if (errorJson && typeof errorJson.message === "string") {
        errorMessage = errorJson.message;
      }
    } catch {
      // Fallback to status message
    }
    throw new GitHubApiError(errorMessage, response.status, rateLimit);
  }

  const data = (await response.json()) as T;
  return { data, rateLimit };
}

/**
 * Paginates through GitHub REST API responses following the RFC 5988 Link header's rel="next"
 * up to a configurable maxPages guard.
 */
export async function githubFetchPaginated<T>(
  initialEndpoint: string,
  options: FetchOptions = {},
  maxPages: number = 3
): Promise<GitHubResponse<T[]>> {
  const allItems: T[] = [];
  let nextUrl: string | null = initialEndpoint;
  let pageCount = 0;
  let latestRateLimit: GitHubRateLimitInfo = {
    limit: 0,
    remaining: 0,
    reset: new Date(),
    used: 0,
  };

  while (nextUrl && pageCount < maxPages) {
    const token = await getGitHubToken();
    const url = nextUrl.startsWith("http")
      ? new URL(nextUrl)
      : new URL(
          `${GITHUB_API_BASE}${nextUrl.startsWith("/") ? "" : "/"}${nextUrl}`
        );

    if (pageCount === 0 && options.params) {
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      });
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "Internship-Contribution-Tracker",
        ...options.headers,
      },
      cache: "no-store",
    });

    latestRateLimit = parseRateLimit(response.headers);
    const retryAfter = response.headers.get("retry-after");

    if (response.status === 401) {
      throw new GitHubUnauthorizedError();
    }

    if (
      (response.status === 403 || response.status === 429) &&
      (latestRateLimit.remaining === 0 || retryAfter !== null)
    ) {
      const resetTime = retryAfter
        ? new Date(Date.now() + parseInt(retryAfter, 10) * 1000)
        : latestRateLimit.reset;
      const formattedTime = resetTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      throw new GitHubRateLimitError(
        `GitHub API rate limit exceeded. Resets at ${formattedTime}.`,
        resetTime,
        latestRateLimit
      );
    }

    if (response.status === 404) {
      throw new GitHubNotFoundError();
    }

    if (!response.ok) {
      throw new GitHubApiError(
        `GitHub request failed with status ${response.status}.`,
        response.status,
        latestRateLimit
      );
    }

    const pageItems = (await response.json()) as T[];
    if (Array.isArray(pageItems)) {
      allItems.push(...pageItems);
    }

    // Follow Link header rel="next"
    nextUrl = parseNextLink(response.headers.get("link"));
    pageCount++;
  }

  return { data: allItems, rateLimit: latestRateLimit };
}
