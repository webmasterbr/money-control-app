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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, monthOneBased: number): number {
  return new Date(year, monthOneBased, 0).getDate();
}

function parseDateInputDay(dateInput: string): number {
  const ymd = dateInput.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) {
    throw new Error("Data inválida para competência");
  }
  return Number(m[3]);
}

/**
 * Sugere `yyyy-MM-dd` no mês informado usando o dia atual.
 * Se o dia atual não existir no mês-alvo, aplica clamp no último dia.
 */
export function getDefaultDateForMonth(competenceMonth: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(competenceMonth);
  if (!m) {
    throw new Error("Competência inválida");
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const today = new Date();
  const day = Math.min(today.getDate(), daysInMonth(year, month));
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Ajusta uma data de input (`yyyy-MM-dd`) para cair dentro do mês de competência.
 * Mantém o dia informado e aplica clamp no último dia quando necessário.
 */
export function clampDateInputToCompetenceMonth(
  dateInput: string,
  competenceMonth: string
): string {
  const m = /^(\d{4})-(\d{2})$/.exec(competenceMonth);
  if (!m) {
    throw new Error("Competência inválida");
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const inputDay = parseDateInputDay(dateInput);
  const day = Math.min(inputDay, daysInMonth(year, month));
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Converte `yyyy-MM-dd` para Date local (meia-noite local), evitando deslocamento por UTC.
 */
export function dateInputToLocalDate(dateInput: string): Date {
  const ymd = dateInput.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) {
    throw new Error("Data inválida para competência");
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Data `yyyy-MM-dd` no mês de competência, usando `dueDay` (1–31) com clamp ao último dia do mês.
 */
export function dateStringForCompetenceAndDueDay(
  competenceMonth: string,
  dueDay: number
): string {
  const [y, m] = competenceMonth.split("-").map(Number);
  const lastDay = daysInMonth(y, m);
  const day = Math.min(Math.max(1, dueDay), lastDay);
  return `${y}-${pad2(m)}-${pad2(day)}`;
}
