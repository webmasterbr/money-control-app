import {
  getComparisonArrow,
  getComparisonColorClass,
  getMonthlyComparison,
  MAX_DISPLAY_PERCENT,
  MONTHLY_COMPARISON_EPSILON,
  type DashboardComparisonKind
} from "@/lib/monthlyComparison";

const diffMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

function formatDiffInParens(diff: number): string {
  const abs = diffMoney.format(Math.abs(diff));
  const sign = diff >= 0 ? "+" : "-";
  return `(${sign}${abs})`;
}

function formatDisplayPercent(percent: number): string {
  const capped = Math.min(Math.abs(percent), MAX_DISPLAY_PERCENT);
  const rounded = Math.round(capped);
  const sign = percent >= 0 ? "+" : "-";
  return `${sign}${rounded}%`;
}

type Props = {
  current: number;
  previous: number;
  kind: DashboardComparisonKind;
  /** Ex.: "Fev" — mês anterior abreviado em pt-BR */
  vsMonthAbbr: string;
};

export function DashboardMonthlyComparison({
  current,
  previous,
  kind,
  vsMonthAbbr
}: Props) {
  const prevZero = Math.abs(previous) < MONTHLY_COMPARISON_EPSILON;

  if (
    prevZero &&
    Math.abs(current) < MONTHLY_COMPARISON_EPSILON
  ) {
    return null;
  }

  const { percent, diff, direction } = getMonthlyComparison(current, previous);
  const arrow = getComparisonArrow(direction);
  const colorClass = getComparisonColorClass(kind, direction);

  const diffPart = formatDiffInParens(diff);
  const vsPart = `vs ${vsMonthAbbr}`;

  let middle: string;
  if (prevZero) {
    middle = `novo ${diffPart}`;
  } else if (percent !== null) {
    middle = `${formatDisplayPercent(percent)} ${diffPart}`;
  } else {
    middle = diffPart;
  }

  return (
    <p className={`mt-1 text-xs opacity-80 ${colorClass}`}>
      {arrow} {middle} {vsPart}
    </p>
  );
}
