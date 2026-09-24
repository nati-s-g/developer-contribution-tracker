import "server-only";

export {
  GITHUB_OAUTH_SCOPES,
  SESSION_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  getAuthConfig,
  getSessionOptions,
} from "./config";
export type { AuthConfig } from "./config";

export {
  getSession,
  requireAuth,
  requireSession,
  getGitHubToken,
  saveSession,
  clearSession,
} from "./session";
export type { SessionUser, SessionData, AuthenticatedSession } from "./session";
