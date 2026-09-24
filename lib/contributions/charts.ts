import type { RepositoryActivityResult } from "./get-activity";
import type {
  ContributionCategory,
  ContributionSummary,
} from "@/types/contributions";
import { getLocalDateString } from "./summarize";

export interface WeeklyActivityDataPoint {
  week: string; // Monday date "YYYY-MM-DD"
  label: string; // Short label "MM-DD"
  commit: number;
  pull_request: number;
  issue: number;
  review: number;
  total: number;
}

export interface CategoryChartDataPoint {
  category: string;
  count: number;
  color: string;
}

/**
 * Calculates the Monday starting date (YYYY-MM-DD) for any given local date.
 */
export function getWeekMonday(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}

/**
 * Builds weekly aggregated activity data points, stacked by kind (commit, pull_request, issue, review).
 * Weeks always start on Monday and are bucketed according to the user's IANA time zone.
 */
export function buildWeeklyActivity(
  activity: Pick<
    RepositoryActivityResult,
    "commits" | "pullRequests" | "issues" | "reviews"
  >,
  from: string,
  to: string,
  timeZone: string
): WeeklyActivityDataPoint[] {
  const startMonday = getWeekMonday(from);
  const endMonday = getWeekMonday(to);

  const [y1, m1, d1] = startMonday.split("-").map(Number);
  const [y2, m2, d2] = endMonday.split("-").map(Number);

  const current = new Date(Date.UTC(y1, m1 - 1, d1));
  const end = new Date(Date.UTC(y2, m2 - 1, d2));

  const weeksMap = new Map<string, WeeklyActivityDataPoint>();

  // Initialize all contiguous Monday weeks in the range
  while (current <= end) {
    const iso = current.toISOString().slice(0, 10);
    const label = iso.slice(5); // "MM-DD"
    weeksMap.set(iso, {
      week: iso,
      label,
      commit: 0,
      pull_request: 0,
      issue: 0,
      review: 0,
      total: 0,
    });
    current.setUTCDate(current.getUTCDate() + 7);
  }

  const increment = (
    timestamp: string | null | undefined,
    kind: "commit" | "pull_request" | "issue" | "review"
  ) => {
    if (!timestamp) return;
    const localDay = getLocalDateString(timestamp, timeZone);
    if (!localDay) return;
    const monday = getWeekMonday(localDay);

    let point = weeksMap.get(monday);
    if (!point) {
      point = {
        week: monday,
        label: monday.slice(5),
        commit: 0,
        pull_request: 0,
        issue: 0,
        review: 0,
        total: 0,
      };
      weeksMap.set(monday, point);
    }

    point[kind] += 1;
    point.total += 1;
  };

  activity.commits.forEach((c) => increment(c.authoredAt, "commit"));
  activity.pullRequests.forEach((pr) =>
    increment(pr.createdAt, "pull_request")
  );
  activity.issues.forEach((issue) => increment(issue.createdAt, "issue"));
  activity.reviews.forEach((r) => increment(r.submittedAt, "review"));

  // Sort weeks chronologically
  return Array.from(weeksMap.values()).sort((a, b) =>
    a.week.localeCompare(b.week)
  );
}

/**
 * Builds data points for the horizontal category distribution chart.
 */
export function buildCategoryChartData(
  summary: Pick<ContributionSummary, "byCategory">
): CategoryChartDataPoint[] {
  const categories: Array<{ category: ContributionCategory; color: string }> = [
    { category: "feature", color: "var(--open)" },
    { category: "bugfix", color: "var(--removed)" },
    { category: "refactor", color: "var(--warning)" },
    { category: "docs", color: "var(--link)" },
    { category: "test", color: "#4ec9b0" },
    { category: "chore", color: "var(--fg-muted)" },
    { category: "other", color: "#808080" },
  ];

  return categories.map((cat) => ({
    category: cat.category,
    count: summary.byCategory[cat.category] ?? 0,
    color: cat.color,
  }));
}
