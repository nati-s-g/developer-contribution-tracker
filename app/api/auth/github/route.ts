import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAuthConfig,
  GITHUB_OAUTH_SCOPES,
  OAUTH_STATE_COOKIE_NAME,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const config = getAuthConfig(request);
    const state = crypto.randomUUID();

    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    const callbackUrl = `${config.appUrl}/api/auth/callback/github`;
    const authorizeParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      scope: GITHUB_OAUTH_SCOPES.join(" "),
      state,
    });

    const githubAuthorizeUrl = `https://github.com/login/oauth/authorize?${authorizeParams.toString()}`;

    return NextResponse.redirect(githubAuthorizeUrl);
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "Failed to initiate GitHub authentication";
    return new NextResponse(
      `Authentication Configuration Error: ${errorMessage}`,
      { status: 500, headers: { "Content-Type": "text/plain" } }
    );
  }
}
