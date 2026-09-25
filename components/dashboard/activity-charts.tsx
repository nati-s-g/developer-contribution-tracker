"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type {
  WeeklyActivityDataPoint,
  CategoryChartDataPoint,
} from "@/lib/contributions/charts";

interface ActivityChartsProps {
  weeklyData: WeeklyActivityDataPoint[];
  categoryData: CategoryChartDataPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-sidebar)] p-2 font-mono text-[11px] shadow-none">
      <div className="border-b border-[var(--border)] pb-1 font-semibold text-[var(--fg-strong)]">
        Week {label}
      </div>
      <div className="mt-1 space-y-0.5">
        {payload.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-1.5 text-[var(--fg-muted)]">
              <span
                className="size-2 rounded-[1px]"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}:</span>
            </span>
            <span className="font-semibold text-[var(--fg-strong)]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  return (
    <div className="border border-[var(--border)] bg-[var(--bg-sidebar)] p-2 font-mono text-[11px] shadow-none">
      <div className="flex items-center gap-2">
        <span className="text-[var(--fg-muted)]">{item.name}:</span>
        <span className="font-semibold text-[var(--fg-strong)]">
          {item.value}
        </span>
      </div>
    </div>
  );
}

export function ActivityCharts({
  weeklyData,
  categoryData,
}: ActivityChartsProps) {
  const hasWeeklyActivity = weeklyData.some((w) => w.total > 0);
  const hasCategoryActivity = categoryData.some((c) => c.count > 0);

  return (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart A: Activity Per Week (Stacked) */}
        <div className="border border-[var(--border)] bg-[var(--bg-editor)] p-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
              Weekly Activity (Stacked by Kind)
            </span>
            <span className="font-mono text-[10px] text-[var(--fg-muted)]">
              Weeks start Mon
            </span>
          </div>

          <div className="mt-3 h-48 w-full">
            {!hasWeeklyActivity ? (
              <div className="flex h-full items-center justify-center font-mono text-xs text-[var(--fg-muted)]">
                No activity to display in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="2 2"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="var(--fg-muted)"
                    tick={{
                      fill: "var(--fg-muted)",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    tickLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis
                    stroke="var(--fg-muted)"
                    allowDecimals={false}
                    tick={{
                      fill: "var(--fg-muted)",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    tickLine={{ stroke: "var(--border)" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: "11px",
                      fontFamily: "monospace",
                      paddingTop: "6px",
                      color: "var(--fg-muted)",
                    }}
                  />
                  <Bar
                    dataKey="commit"
                    name="Commits"
                    stackId="a"
                    fill="var(--fg-muted)"
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="pull_request"
                    name="PRs"
                    stackId="a"
                    fill="var(--link)"
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="issue"
                    name="Issues"
                    stackId="a"
                    fill="var(--open)"
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="review"
                    name="Reviews"
                    stackId="a"
                    fill="var(--merged)"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart B: Contributions by Category (Horizontal Bars) */}
        <div className="border border-[var(--border)] bg-[var(--bg-editor)] p-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-[var(--fg-muted)] uppercase">
              Contributions by Category
            </span>
          </div>

          <div className="mt-3 h-48 w-full">
            {!hasCategoryActivity ? (
              <div className="flex h-full items-center justify-center font-mono text-xs text-[var(--fg-muted)]">
                No categorized contributions to display
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={categoryData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="2 2"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="var(--fg-muted)"
                    allowDecimals={false}
                    tick={{
                      fill: "var(--fg-muted)",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    tickLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="var(--fg-muted)"
                    width={55}
                    tick={{
                      fill: "var(--fg-muted)",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                    tickLine={{ stroke: "var(--border)" }}
                  />
                  <Tooltip content={<CategoryTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Contributions"
                    fill="var(--accent)"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
