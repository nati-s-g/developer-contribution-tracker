import "server-only";
import { NextResponse } from "next/server";
import { listRepositories } from "@/lib/github";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  try {
    const res = await listRepositories();
    return NextResponse.json({ repositories: res.data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load repositories.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
