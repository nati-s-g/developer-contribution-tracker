import "server-only";
import type { SessionOptions } from "iron-session";

/**
 * GitHub OAuth Scopes
 *
 * SCOPE TRADE-OFF DOCUMENTATION:
 * GitHub OAuth Apps do not offer a granular "read-only private repositories" scope.
 * Accessing private repository metadata, commits, and pull requests requires the
 * broad "repo" scope, which inherently includes write/delete permissions.
 *
 * This is the primary privacy trade-off of the MVP. We deliberately restrict requested
 * scopes to ONLY:
 * - "read:user": to read the developer's public profile (login name, avatar, id).
 * - "repo": required by GitHub's OAuth model to read private repositories.
 *
 * We explicitly DO NOT request "user:email" or any other scopes unless a future
 * feature mandates it.
 *
 * KNOWN LIMITATION (Organization Restrictions):
 * GitHub organizations may enforce third-party application access restrictions.
 * If an organization has not approved this OAuth application, repositories belonging
 * to that organization will not be returned by the GitHub API. This is standard GitHub
 * security behavior and should be treated gracefully, not as an application error.
 */
export const GITHUB_OAUTH_SCOPES = ["read:user", "repo"] as const;

export const SESSION_COOKIE_NAME = "ict_session";
export const OAUTH_STATE_COOKIE_NAME = "ict_oauth_state";

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  sessionSecret: string;
  appUrl: string;
}

/**
 * Resolves the application base URL dynamically:
 * 1. Inspects incoming Request headers (x-forwarded-proto, x-forwarded-host)
 * 2. Inspects request.url origin
 * 3. Inspects NEXT_PUBLIC_APP_URL environment variable
 * 4. Inspects VERCEL_PROJECT_PRODUCTION_URL or VERCEL_URL (injected by Vercel)
 * 5. Falls back to "http://localhost:3000" for local development
 */
export function resolveAppUrl(request?: Request): string {
  if (request) {
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (request.url.startsWith("https") ? "https" : "http");
    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");

    if (host) {
      return `${proto}://${host}`.replace(/\/$/, "");
    }

    try {
      return new URL(request.url).origin.replace(/\/$/, "");
    } catch {
      // Fall through to environment variables
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`.replace(
      /\/$/,
      ""
    );
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

/**
 * Retrieves and validates required authentication environment variables.
 * Fails fast with clear descriptive error messages if required variables are missing.
 */
export function getAuthConfig(request?: Request): AuthConfig {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  const sessionSecret = (
    process.env.SESSION_SECRET || process.env.AUTH_SECRET
  )?.trim();
  const appUrl = resolveAppUrl(request);

  if (!clientId) {
    throw new Error(
      "Missing GITHUB_CLIENT_ID environment variable. Please configure it in .env.local."
    );
  }

  if (!clientSecret) {
    throw new Error(
      "Missing GITHUB_CLIENT_SECRET environment variable. Please configure it in .env.local."
    );
  }

  if (!sessionSecret) {
    throw new Error(
      "Missing SESSION_SECRET (or AUTH_SECRET) environment variable. Please configure it in .env.local with a strong key (at least 32 characters)."
    );
  }

  if (sessionSecret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long to ensure secure AES-256-GCM encryption."
    );
  }

  return {
    clientId,
    clientSecret,
    sessionSecret,
    appUrl,
  };
}

/**
 * Iron-session configuration options.
 * Generates options dynamically to ensure the validated secret is used.
 */
export function getSessionOptions(): SessionOptions {
  const { sessionSecret } = getAuthConfig();

  return {
    cookieName: SESSION_COOKIE_NAME,
    password: sessionSecret,
    ttl: 60 * 60 * 24 * 7, // 7 days in seconds
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}
