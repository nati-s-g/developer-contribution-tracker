import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await clearSession();

  // If requested with a redirect destination or form submission, redirect to welcome page
  return NextResponse.redirect(new URL("/", request.url), {
    status: 303, // See Other: forces GET request on redirection
  });
}
