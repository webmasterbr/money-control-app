"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  isValidDashboardMonthQuery,
  resolveDashboardMonth,
  ROUTES_WITH_MONTH_SEARCH_PARAM
} from "@/lib/dashboardMonth";

const ROUTES_WITH_MONTH_SET = new Set<string>(
  ROUTES_WITH_MONTH_SEARCH_PARAM
);

/**
 * Centraliza leitura de `?month=YYYY-MM`, validação (mesmo regex que o servidor)
 * e fallback para o mês calendário atual no cliente.
 *
 * Use dentro de um boundary `<Suspense>` (ex.: BottomNav no layout).
 */
export function useDashboardMonth() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const hasValidMonthInUrl = isValidDashboardMonthQuery(monthParam);

  const resolved = useMemo(
    () => resolveDashboardMonth(monthParam ?? undefined, new Date()),
    [monthParam]
  );

  const monthQuery = useMemo(() => {
    if (!hasValidMonthInUrl || !monthParam) return "";
    return `?month=${encodeURIComponent(monthParam)}`;
  }, [hasValidMonthInUrl, monthParam]);

  function hrefWithMonth(path: string): string {
    if (!ROUTES_WITH_MONTH_SET.has(path)) return path;
    return `${path}${monthQuery}`;
  }

  return {
    /** Valor cru da query (`null` se ausente). */
    monthParam,
    /** `true` se `month` existe e passa em `isValidDashboardMonthQuery`. */
    hasValidMonthInUrl,
    /**
     * `YYYY-MM` efetivo: o da URL se válido; senão o mês calendário atual
     * (alinhado a `resolveDashboardMonth` no servidor).
     */
    yearMonth: resolved.yearMonth,
    referenceDate: resolved.referenceDate,
    isCurrentCalendarMonth: resolved.isCurrentCalendarMonth,
    /** `?month=...` ou string vazia (para concatenar ao path). */
    monthQuery,
    /** Só acrescenta `monthQuery` em rotas listadas em `ROUTES_WITH_MONTH_SEARCH_PARAM`. */
    hrefWithMonth
  };
}
