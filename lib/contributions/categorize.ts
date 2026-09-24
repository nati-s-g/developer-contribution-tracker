/**
 * Pure and deterministic contribution categorization rules.
 *
 * EVALUATION ORDER:
 * 1. Conventional Commit Prefix:
 *    Matches standard prefixes with optional scope and breaking change indicator (!):
 *    - `feat` -> "feature"
 *    - `fix` -> "bugfix"
 *    - `refactor` / `perf` -> "refactor"
 *    - `docs` -> "docs"
 *    - `test` -> "test"
 *    - `chore` / `style` / `ci` / `build` -> "chore"
 *
 * 2. Labels (on PRs and issues):
 *    - "bug", "fix", "defect" -> "bugfix"
 *    - "feature", "enhancement" -> "feature"
 *    - "refactor", "performance", "perf", "optimization" -> "refactor"
 *    - "documentation", "docs" -> "docs"
 *    - "test", "tests", "testing" -> "test"
 *    - "chore", "ci", "build", "dependencies", "deps", "maintenance" -> "chore"
 *
 * 3. Title Keywords (word boundaries in fixed priority order):
 *    - bugfix: \b(fix|fixes|fixed|bug|bugs|hotfix|patch)\b
 *    - feature: \b(feat|feature|add|adds|added|implement|implements|implemented|create|creates|created|support)\b
 *    - refactor: \b(refactor|refactors|refactored|perf|performance|optimize|clean|cleanup)\b
 *    - docs: \b(doc|docs|documentation|readme)\b
 *    - test: \b(test|tests|tested|testing|spec|specs)\b
 *    - chore: \b(chore|deps|bump|upgrade|update|ci|build|release|style|lint)\b
 *
 * 4. Fallback: "other"
 */

import type { ContributionCategory } from "@/types/contributions";

const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|refactor|perf|docs|test|chore|style|ci|build)(?:\([^)]+\))?!?:/i;

const KEYWORD_RULES: Array<{
  category: ContributionCategory;
  pattern: RegExp;
}> = [
  {
    category: "bugfix",
    pattern: /\b(fix|fixes|fixed|bug|bugs|hotfix|patch)\b/i,
  },
  {
    category: "feature",
    pattern:
      /\b(feat|feature|add|adds|added|implement|implements|implemented|create|creates|created|support)\b/i,
  },
  {
    category: "refactor",
    pattern:
      /\b(refactor|refactors|refactored|perf|performance|optimize|clean|cleanup)\b/i,
  },
  {
    category: "docs",
    pattern: /\b(doc|docs|documentation|readme)\b/i,
  },
  {
    category: "test",
    pattern: /\b(test|tests|tested|testing|spec|specs)\b/i,
  },
  {
    category: "chore",
    pattern:
      /\b(chore|deps|bump|upgrade|update|ci|build|release|style|lint)\b/i,
  },
];

/**
 * Determines the contribution category for a given title/message and optional labels.
 * This function is pure and deterministic.
 */
export function categorizeContribution(
  titleOrMessage: string,
  labels: string[] = []
): ContributionCategory {
  const cleanTitle = (titleOrMessage || "").trim();

  // Rule 1: Conventional Commit Prefix
  const conventionalMatch = cleanTitle.match(CONVENTIONAL_COMMIT_REGEX);
  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    switch (type) {
      case "feat":
        return "feature";
      case "fix":
        return "bugfix";
      case "refactor":
      case "perf":
        return "refactor";
      case "docs":
        return "docs";
      case "test":
        return "test";
      case "chore":
      case "style":
      case "ci":
      case "build":
        return "chore";
    }
  }

  // Rule 2: Labels
  const normalizedLabels = labels.map((l) => l.toLowerCase().trim());
  for (const label of normalizedLabels) {
    if (
      label.includes("bug") ||
      label.includes("fix") ||
      label.includes("defect")
    ) {
      return "bugfix";
    }
    if (label.includes("enhancement") || label.includes("feature")) {
      return "feature";
    }
    if (
      label.includes("refactor") ||
      label.includes("perf") ||
      label.includes("optimization")
    ) {
      return "refactor";
    }
    if (label.includes("doc") || label.includes("documentation")) {
      return "docs";
    }
    if (
      label.includes("test") ||
      label.includes("testing") ||
      label.includes("spec")
    ) {
      return "test";
    }
    if (
      label.includes("chore") ||
      label.includes("ci") ||
      label.includes("build") ||
      label.includes("dep") ||
      label.includes("maintenance")
    ) {
      return "chore";
    }
  }

  // Rule 3: Title Keywords (evaluated in fixed priority order)
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(cleanTitle)) {
      return rule.category;
    }
  }

  // Rule 4: Fallback
  return "other";
}
