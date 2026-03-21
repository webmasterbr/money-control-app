/**
 * Deriva YYYY-MM de competência a partir da data da despesa (campo `date`).
 * Para strings no formato yyyy-MM-dd (input HTML), usa o prefixo direto (sem fuso).
 */
export function competenceMonthFromDateInput(date: string | Date): string {
  if (typeof date === "string") {
    const ymd = date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      return ymd.slice(0, 7);
    }
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    throw new Error("Data inválida para competência");
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
