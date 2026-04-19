export const MONTHLY_COMPARISON_EPSILON = 0.01;

export type ComparisonDirection = "up" | "down" | "equal";

export type DashboardComparisonKind = "income" | "expense" | "balance";

/** Percentual exibido no card não passa deste valor (evita +9900% etc.). */
export const MAX_DISPLAY_PERCENT = 999;

export type MonthlyComparisonResult = {
  percent: number | null;
  diff: number;
  direction: ComparisonDirection;
};

export function getMonthlyComparison(
  current: number,
  previous: number
): MonthlyComparisonResult {
  const diff = current - previous;

  let direction: ComparisonDirection;
  if (Math.abs(diff) < MONTHLY_COMPARISON_EPSILON) {
    direction = "equal";
  } else if (diff > 0) {
    direction = "up";
  } else {
    direction = "down";
  }

  const percent =
    Math.abs(previous) < MONTHLY_COMPARISON_EPSILON
      ? null
      : ((current - previous) / previous) * 100;

  return { percent, diff, direction };
}

export function getComparisonArrow(direction: ComparisonDirection): string {
  if (direction === "equal") return "→";
  if (direction === "up") return "↑";
  return "↓";
}

const GREEN = "text-emerald-600 dark:text-emerald-400";
const RED = "text-rose-600 dark:text-rose-400";
const AMBER = "text-amber-600 dark:text-amber-400";

export function getComparisonColorClass(
  kind: DashboardComparisonKind,
  direction: ComparisonDirection
): string {
  if (direction === "equal") return AMBER;

  if (kind === "expense") {
    return direction === "up" ? RED : GREEN;
  }

  return direction === "up" ? GREEN : RED;
}
