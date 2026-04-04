/**
 * Datas de lançamento/vencimento como "dia civil" estável entre Vercel (UTC),
 * Postgres e browsers em qualquer fuso: persistimos e reinterpretamos ao meio-dia UTC.
 */

export function dateInputToStoredDate(dateInput: string): Date {
  const ymd = dateInput.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error("Data inválida");
  }
  return new Date(`${ymd}T12:00:00.000Z`);
}

/** ISO vindo da API (Prisma) → Date alinhado ao yyyy-MM-dd do instante armazenado. */
export function parseApiCalendarDate(iso: string): Date {
  const ymd = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error("Data inválida");
  }
  return new Date(`${ymd}T12:00:00.000Z`);
}
