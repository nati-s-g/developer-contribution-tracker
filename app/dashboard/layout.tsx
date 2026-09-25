import type { Metadata } from "next";
import { DashboardShell } from "@/components/shell";
import { requireAuth } from "@/lib/auth";
import { listRepositories } from "@/lib/github";
import type { RepositorySummary } from "@/types/contributions";

export const metadata: Metadata = {
  title: "Dashboard · Developer Contribution Tracker",
  description: "View and filter repository contribution activity",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo-icon.png", type: "image/png" },
    ],
    apple: "/logo-icon.png",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  let repositories: RepositorySummary[] = [];
  let repoError: string | null = null;

  try {
    const res = await listRepositories();
    repositories = res.data;
  } catch (error) {
    repoError =
      error instanceof Error
        ? error.message
        : "Failed to load repositories from GitHub.";
  }

  return (
    <DashboardShell
      user={session.user.login}
      repositories={repositories}
      repoError={repoError}
    >
      {children}
    </DashboardShell>
  );
}
