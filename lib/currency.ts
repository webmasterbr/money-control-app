/**
 * Formatação e máscara BRL compartilhada (inputs centavos → exibição R$).
 * TODO: migrar IncomesPageClient para este módulo e remover duplicação local.
 */

export function formatCurrencyInput(rawValue: string): string {
  const digitsOnly = rawValue.replace(/\D/g, "");
  if (!digitsOnly) return "";

  const numericValue = Number(digitsOnly) / 100;
  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function parseCurrencyInput(maskedValue: string): number {
  const digitsOnly = maskedValue.replace(/\D/g, "");
  if (!digitsOnly) return 0;
  return Number(digitsOnly) / 100;
}

export function amountToCurrencyMask(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "";
  }
  const cents = Math.round(Number(amount) * 100);
  return formatCurrencyInput(String(cents));
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
