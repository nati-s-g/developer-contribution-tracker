import { z } from "zod";

/**
 * Validates whether a given string is a recognized IANA time zone identifier.
 */
export function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a Date object as YYYY-MM-DD in the specified time zone.
 */
export function getTodayInTimeZone(timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Returns the latest calendar date currently reached anywhere on Earth (UTC+14).
 * This ensures that when a user in an eastern timezone submits today's local date
 * before UTC has reached midnight, or if tz defaults to UTC, it is never falsely rejected as a future date.
 */
export function getLatestEarthDate(): string {
  return getTodayInTimeZone("Pacific/Kiritimati");
}

/**
 * Zod Schema for Dashboard Query Parameters
 */
export const dashboardParamsSchema = z
  .object({
    repo: z
      .string()
      .trim()
      .regex(
        /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/,
        "Repository must be in 'owner/name' format with valid characters (alphanumeric, -, _, .)."
      )
      .nullable()
      .optional(),
    from: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format.")
      .nullable()
      .optional(),
    to: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format.")
      .nullable()
      .optional(),
    tz: z.string().trim().default("UTC"),
  })
  .superRefine((data, ctx) => {
    // 1. Validate Time Zone
    const timeZone = isValidTimeZone(data.tz) ? data.tz : "UTC";
    if (data.tz && !isValidTimeZone(data.tz)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tz"],
        message: `Invalid IANA time zone "${data.tz}". Defaulted to UTC.`,
      });
    }

    // 2. Validate Date Range if either date is specified
    if (data.from && data.to) {
      const fromDate = new Date(data.from);
      const toDate = new Date(data.to);

      if (isNaN(fromDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["from"],
          message: "Start date is not a valid calendar date.",
        });
      }

      if (isNaN(toDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["to"],
          message: "End date is not a valid calendar date.",
        });
      }

      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        if (data.from > data.to) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["range"],
            message: "Start date must be earlier than or equal to end date.",
          });
        }

        const todayInTz = getTodayInTimeZone(timeZone);
        const latestEarthDate = getLatestEarthDate();
        const maxAllowedDate =
          todayInTz > latestEarthDate ? todayInTz : latestEarthDate;

        if (data.to > maxAllowedDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["to"],
            message: "End date cannot be in the future.",
          });
        }

        const diffDays = Math.round(
          (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 366) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["range"],
            message: "Analysis date range cannot exceed 366 days (1 year).",
          });
        }
      }
    } else if (data.from && !data.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "End date is required when start date is provided.",
      });
    } else if (!data.from && data.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "Start date is required when end date is provided.",
      });
    }
  });

export interface ParsedDashboardParams {
  repo: string | null;
  from: string | null;
  to: string | null;
  tz: string;
  hasSelection: boolean;
  isValid: boolean;
  errors: {
    repo?: string;
    from?: string;
    to?: string;
    range?: string;
    tz?: string;
  };
}

/**
 * Safely parses and validates search parameters for the dashboard route.
 * Guarantees a friendly response structure that never crashes the server.
 */
export function parseDashboardParams(
  rawParams: Record<string, string | string[] | undefined> | URLSearchParams
): ParsedDashboardParams {
  const getParam = (key: string): string | null => {
    if (rawParams instanceof URLSearchParams) {
      return rawParams.get(key);
    }
    const val = rawParams[key];
    if (Array.isArray(val)) return val[0] || null;
    return typeof val === "string" ? val : null;
  };

  const rawRepo = getParam("repo");
  const rawFrom = getParam("from");
  const rawTo = getParam("to");
  const rawTz = getParam("tz") || "UTC";

  const result = dashboardParamsSchema.safeParse({
    repo: rawRepo,
    from: rawFrom,
    to: rawTo,
    tz: rawTz,
  });

  const timeZone = isValidTimeZone(rawTz) ? rawTz : "UTC";

  const errors: ParsedDashboardParams["errors"] = {};

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof ParsedDashboardParams["errors"];
      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    });
  }

  const hasSelection = Boolean(rawRepo && rawFrom && rawTo);
  const isValid = result.success && Object.keys(errors).length === 0;

  return {
    repo: rawRepo,
    from: rawFrom,
    to: rawTo,
    tz: timeZone,
    hasSelection,
    isValid,
    errors,
  };
}
