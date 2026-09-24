import { describe, it, expect } from "vitest";
import {
  categorizeContribution,
  summarizeContributions,
  buildTimeline,
  getLocalDateString,
} from "@/lib/contributions";
import type {
  CommitItem,
  PullRequestSummary,
  IssueItem,
  ReviewItem,
} from "@/types/contributions";

describe("categorizeContribution", () => {
  it("categorizes Conventional Commit with scope and '!' breaking change indicator", () => {
    expect(categorizeContribution("feat(auth)!: redesign session system")).toBe(
      "feature"
    );
    expect(
      categorizeContribution("fix(api)!: correct 404 response payload")
    ).toBe("bugfix");
    expect(categorizeContribution("refactor(db)!: drop legacy column")).toBe(
      "refactor"
    );
    expect(categorizeContribution("docs(readme)!: rewrite quickstart")).toBe(
      "docs"
    );
    expect(categorizeContribution("test(unit)!: migrate to vitest")).toBe(
      "test"
    );
    expect(categorizeContribution("chore(deps)!: bump dependencies")).toBe(
      "chore"
    );
  });

  it("categorizes standard Conventional Commits without scope", () => {
    expect(categorizeContribution("feat: add date picker")).toBe("feature");
    expect(categorizeContribution("fix: resolve rate limit parsing")).toBe(
      "bugfix"
    );
    expect(categorizeContribution("perf: cache github requests")).toBe(
      "refactor"
    );
    expect(categorizeContribution("style: format with prettier")).toBe("chore");
    expect(categorizeContribution("ci: update deployment workflow")).toBe(
      "chore"
    );
  });

  it("prioritizes labels when conventional prefix is absent", () => {
    expect(categorizeContribution("Address customer feedback", ["bug"])).toBe(
      "bugfix"
    );
    expect(categorizeContribution("New landing page", ["enhancement"])).toBe(
      "feature"
    );
    expect(categorizeContribution("Improve bundle size", ["refactor"])).toBe(
      "refactor"
    );
    expect(categorizeContribution("Api guide", ["documentation"])).toBe("docs");
    expect(categorizeContribution("E2E suite", ["testing"])).toBe("test");
    expect(categorizeContribution("Weekly maintenance", ["chore"])).toBe(
      "chore"
    );
  });

  it("falls back to title keywords with word boundaries", () => {
    expect(categorizeContribution("Hotfix for production crash")).toBe(
      "bugfix"
    );
    expect(categorizeContribution("Implement GitHub OAuth")).toBe("feature");
    expect(categorizeContribution("Clean up unused imports")).toBe("refactor");
    expect(
      categorizeContribution("Update README with install instructions")
    ).toBe("docs");
    expect(categorizeContribution("Specs for pagination")).toBe("test");
    expect(categorizeContribution("Bump next from 15 to 16")).toBe("chore");
  });

  it("categorizes unclassifiable items as other", () => {
    expect(categorizeContribution("Meeting notes sync")).toBe("other");
    expect(categorizeContribution("")).toBe("other");
  });
});

describe("summarizeContributions & Time Zone Active Days", () => {
  it("handles empty range with zeroes and nulls", () => {
    const summary = summarizeContributions({
      commits: [],
      pullRequests: [],
      issues: [],
      reviews: [],
    });

    expect(summary.commits).toBe(0);
    expect(summary.pullRequests).toBe(0);
    expect(summary.mergedPullRequests).toBe(0);
    expect(summary.issues).toBe(0);
    expect(summary.reviews).toBe(0);
    expect(summary.activeDays).toBe(0);
    expect(summary.additions).toBe(0);
    expect(summary.deletions).toBe(0);
    expect(summary.firstActivityAt).toBeNull();
    expect(summary.lastActivityAt).toBeNull();
    expect(summary.byCategory.feature).toBe(0);
    expect(summary.byCategory.other).toBe(0);
  });

  it("correctly shifts local calendar day across time zones (e.g. Africa/Addis_Ababa)", () => {
    // 23:30 UTC on June 4th is 02:30 AM on June 5th in East Africa Time (UTC+3, Africa/Addis_Ababa)
    const timestamp = "2026-06-04T23:30:00.000Z";

    const utcDay = getLocalDateString(timestamp, "UTC");
    const eatDay = getLocalDateString(timestamp, "Africa/Addis_Ababa");

    expect(utcDay).toBe("2026-06-04");
    expect(eatDay).toBe("2026-06-05");
  });

  it("calculates active days and category counts in target timezone", () => {
    const commits: CommitItem[] = [
      {
        sha: "1111111",
        shortSha: "1111111",
        message: "feat: add first feature",
        authoredAt: "2026-06-04T23:30:00.000Z", // June 4 in UTC, June 5 in Africa/Addis_Ababa
        url: "https://github.com",
      },
      {
        sha: "2222222",
        shortSha: "2222222",
        message: "fix: fix bug",
        authoredAt: "2026-06-05T01:00:00.000Z", // June 5 in UTC and Africa/Addis_Ababa
        url: "https://github.com",
      },
    ];

    const prs: PullRequestSummary[] = [
      {
        number: 42,
        title: "feat(ui): date picker",
        state: "merged",
        draft: false,
        merged: true,
        mergedAt: "2026-06-05T10:00:00.000Z",
        createdAt: "2026-06-04T12:00:00.000Z",
        updatedAt: "2026-06-05T10:00:00.000Z",
        additions: 120,
        deletions: 30,
        changedFiles: 4,
        excerpt: "Feature description",
        url: "https://github.com",
      },
    ];

    // In UTC:
    // "2026-06-04T23:30:00Z" -> 2026-06-04
    // "2026-06-04T12:00:00Z" -> 2026-06-04
    // "2026-06-05T01:00:00Z" -> 2026-06-05
    // Distinct days in UTC = 2 (June 4, June 5)
    const summaryUtc = summarizeContributions(
      { commits, pullRequests: prs, issues: [], reviews: [] },
      "UTC"
    );
    expect(summaryUtc.activeDays).toBe(2);
    expect(summaryUtc.commits).toBe(2);
    expect(summaryUtc.pullRequests).toBe(1);
    expect(summaryUtc.mergedPullRequests).toBe(1);
    expect(summaryUtc.additions).toBe(120);
    expect(summaryUtc.deletions).toBe(30);
    expect(summaryUtc.byCategory.feature).toBe(2);
    expect(summaryUtc.byCategory.bugfix).toBe(1);

    // In Africa/Addis_Ababa (UTC+3):
    // "2026-06-04T23:30:00Z" -> 2026-06-05 (02:30 AM)
    // "2026-06-05T01:00:00Z" -> 2026-06-05 (04:00 AM)
    // "2026-06-04T12:00:00Z" -> 2026-06-04 (03:00 PM)
    // Distinct days in EAT = 2 (June 4, June 5)
    const summaryEat = summarizeContributions(
      { commits, pullRequests: prs, issues: [], reviews: [] },
      "Africa/Addis_Ababa"
    );
    expect(summaryEat.activeDays).toBe(2);
  });
});

describe("buildTimeline", () => {
  it("groups activity by local date and sorts newest first", () => {
    const commits: CommitItem[] = [
      {
        sha: "aaaaaa1",
        shortSha: "aaaaaa1",
        message: "docs: update readme",
        authoredAt: "2026-06-04T23:30:00.000Z",
        url: "https://github.com/commits/1",
      },
    ];

    const issues: IssueItem[] = [
      {
        number: 10,
        title: "bug: login broken",
        state: "open",
        createdAt: "2026-06-02T10:00:00.000Z",
        closedAt: null,
        labels: ["bug"],
        url: "https://github.com/issues/10",
      },
    ];

    const reviews: ReviewItem[] = [
      {
        id: 999,
        prNumber: 5,
        prTitle: "feat: auth provider",
        prUrl: "https://github.com/pulls/5",
        state: "APPROVED",
        submittedAt: "2026-06-03T15:00:00.000Z",
      },
    ];

    // Grouping in UTC:
    const timelineUtc = buildTimeline(
      { commits, pullRequests: [], issues, reviews },
      "UTC"
    );
    expect(timelineUtc.length).toBe(3);
    expect(timelineUtc[0].date).toBe("2026-06-04");
    expect(timelineUtc[0].items[0].kind).toBe("commit");
    expect(timelineUtc[1].date).toBe("2026-06-03");
    expect(timelineUtc[1].items[0].kind).toBe("review");
    expect(timelineUtc[2].date).toBe("2026-06-02");
    expect(timelineUtc[2].items[0].kind).toBe("issue");

    // Grouping in Africa/Addis_Ababa:
    // 2026-06-04T23:30:00.000Z falls on 2026-06-05
    const timelineEat = buildTimeline(
      { commits, pullRequests: [], issues, reviews },
      "Africa/Addis_Ababa"
    );
    expect(timelineEat[0].date).toBe("2026-06-05");
  });
});
