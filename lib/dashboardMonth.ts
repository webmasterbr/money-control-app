import { format } from "date-fns";

const YYYY_MM = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Rotas onde `?month=YYYY-MM` deve ser preservado na navegação (BottomNav, etc.). */
export const ROUTES_WITH_MONTH_SEARCH_PARAM = [
  "/dashboard",
  "/incomes",
  "/expenses"
] as const;

export type RouteWithMonthSearchParam =
  (typeof ROUTES_WITH_MONTH_SEARCH_PARAM)[number];

/** `true` se o valor for `YYYY-MM` válido (mesmo critério que `?month=` no dashboard). */
export function isValidDashboardMonthQuery(
  value: string | null
): value is string {
  return value !== null && YYYY_MM.test(value);
}

/**
 * Parse comum para `?month=` em listagens (default = mês calendário atual).
 */
export function parseYearMonthListQuery(
  param: string | null,
  now: Date = new Date()
): { yearMonth: string } | { error: string } {
  const currentYm = format(now, "yyyy-MM");
  if (param === null || param === "") {
    return { yearMonth: currentYm };
  }
  if (!YYYY_MM.test(param)) {
    return { error: "Mês inválido" };
  }
  return { yearMonth: param };
}

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

/**
 * Valida `month` da query string para listagem de despesas por competência.
 * Ausente ou vazio → mês calendário atual; inválido → erro (API deve responder 400).
 */
export function parseExpenseListMonthParam(
  param: string | null,
  now: Date = new Date()
): { competenceMonth: string } | { error: string } {
  const r = parseYearMonthListQuery(param, now);
  if ("error" in r) return r;
  return { competenceMonth: r.yearMonth };
}
