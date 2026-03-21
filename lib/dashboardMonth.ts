import { format } from "date-fns";

const YYYY_MM = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Interpreta ?month=YYYY-MM para o dashboard.
 * Comparação "mês atual" usa o mesmo fuso de `now` (tipicamente o do servidor Node).
 */
export function resolveDashboardMonth(
  monthParam: string | undefined,
  now: Date = new Date()
): {
  yearMonth: string;
  referenceDate: Date;
  isCurrentCalendarMonth: boolean;
} {
  const currentYm = format(now, "yyyy-MM");

  const yearMonth =
    monthParam && YYYY_MM.test(monthParam) ? monthParam : currentYm;

  const [y, m] = yearMonth.split("-").map(Number);
  const isCurrentCalendarMonth = yearMonth === currentYm;

  const referenceDate = isCurrentCalendarMonth
    ? now
    : new Date(y, m - 1, 1);

  return {
    yearMonth,
    referenceDate,
    isCurrentCalendarMonth
  };
}
