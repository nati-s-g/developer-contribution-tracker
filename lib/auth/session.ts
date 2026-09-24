import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { getSessionOptions } from "@/lib/auth/config";

export interface SessionUser {
  id: number;
  login: string;
  avatarUrl: string;
  name?: string | null;
}

export interface SessionData {
  user?: SessionUser;
  accessToken?: string;
}

export interface AuthenticatedSession {
  user: SessionUser;
  accessToken: string;
}

/**
 * Retrieves the current session data if signed in.
 * Returns null if the session cookie is missing, expired, or invalid.
 */
export async function getSession(): Promise<AuthenticatedSession | null> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      getSessionOptions()
    );

    if (!session.user || !session.accessToken) {
      return null;
    }

    return {
      user: session.user,
      accessToken: session.accessToken,
    };
  } catch {
    // If the cookie is malformed or decryption fails, safely treat as unauthenticated
    return null;
  }
}

/**
 * Requires an authenticated session in server code (Server Components, Route Handlers).
 * Redirects to the welcome page (/) immediately if not signed in.
 */
export async function requireAuth(): Promise<AuthenticatedSession> {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return session;
}

/**
 * Alias for requireAuth() to maintain naming compatibility across project conventions.
 */
export async function requireSession(): Promise<AuthenticatedSession> {
  return requireAuth();
}

/**
 * The ONLY centralized way any code obtains the GitHub access token.
 * Strictly server-only. Throws/redirects if no active session exists.
 */
export async function getGitHubToken(): Promise<string> {
  const session = await requireAuth();
  return session.accessToken;
}

/**
 * Persists an authenticated session into the encrypted HttpOnly cookie.
 */
export async function saveSession(
  user: SessionUser,
  accessToken: string
): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions()
  );

  session.user = user;
  session.accessToken = accessToken;
  await session.save();
}

/**
 * Clears and invalidates the session cookie.
 */
export async function clearSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      getSessionOptions()
    );
    session.destroy();
  } catch {
    // Graceful no-op if session already invalid
  }
}
