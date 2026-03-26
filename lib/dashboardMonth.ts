import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

const YYYY_MM = /^\d{4}-(0[1-9]|1[0-2])$/;

function capitalizePt(text: string) {
  if (!text) return text;
  return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
}

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

/** `true` se `value` for competência `YYYY-MM` válida. */
export function isValidCompetenceMonth(value: string): boolean {
  return YYYY_MM.test(value);
}

/**
 * Mês de competência imediatamente anterior a `ym` (`YYYY-MM`).
 * Janeiro → dezembro do ano anterior.
 */
export function previousCompetenceMonth(ym: string): string {
  if (!YYYY_MM.test(ym)) {
    throw new Error("Mês inválido");
  }
  const [y, m] = ym.split("-").map(Number);
  const prev = new Date(y, m - 2, 1);
  return format(prev, "yyyy-MM");
}

/**
 * Formata competência `YYYY-MM` como `Mês Ano` em pt-BR.
 * Ex.: `2026-02` -> `Fevereiro 2026`.
 */
export function formatCompetenceMonth(ym: string): string {
  if (!YYYY_MM.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  const monthAnchor = new Date(y, m - 1, 1);
  return capitalizePt(format(monthAnchor, "MMMM yyyy", { locale: ptBR }));
}
