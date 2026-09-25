import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAuthConfig,
  OAUTH_STATE_COOKIE_NAME,
  saveSession,
  type SessionUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  avatar_url: string;
  name?: string | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

  // Clean up state cookie immediately
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  // 1. Handle user cancellation or GitHub-side errors
  if (oauthError) {
    if (oauthError === "access_denied") {
      return NextResponse.redirect(
        new URL("/?auth_error=cancelled", request.url)
      );
    }
    return NextResponse.redirect(
      new URL("/?auth_error=github_error", request.url)
    );
  }

  // 2. Validate state to protect against CSRF attacks
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL("/?auth_error=invalid_state", request.url)
    );
  }

  // 3. Ensure code was provided
  if (!code) {
    return NextResponse.redirect(
      new URL("/?auth_error=missing_code", request.url)
    );
  }

  let config;
  try {
    config = getAuthConfig(request);
  } catch {
    return NextResponse.redirect(
      new URL("/?auth_error=config_missing", request.url)
    );
  }

  // 4. Exchange code for access token via backend-to-backend request
  let accessToken: string | undefined;
  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: `${config.appUrl}/api/auth/callback/github`,
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL("/?auth_error=exchange_failed", request.url)
      );
    }

    const tokenData: GitHubTokenResponse = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      return NextResponse.redirect(
        new URL("/?auth_error=exchange_failed", request.url)
      );
    }

    accessToken = tokenData.access_token;
  } catch {
    return NextResponse.redirect(
      new URL("/?auth_error=exchange_failed", request.url)
    );
  }

  // 5. Fetch authenticated user profile
  let sessionUser: SessionUser;
  try {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Developer-Contribution-Tracker",
      },
      cache: "no-store",
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL("/?auth_error=user_fetch_failed", request.url)
      );
    }

    const userData: GitHubUserResponse = await userResponse.json();

    sessionUser = {
      id: userData.id,
      login: userData.login,
      avatarUrl: userData.avatar_url,
      name: userData.name || null,
    };
  } catch {
    return NextResponse.redirect(
      new URL("/?auth_error=user_fetch_failed", request.url)
    );
  }

  // 6. Seal user and access token inside encrypted HttpOnly cookie
  try {
    await saveSession(sessionUser, accessToken);
  } catch {
    return NextResponse.redirect(
      new URL("/?auth_error=session_save_failed", request.url)
    );
  }

  // 7. Successful authentication — redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
