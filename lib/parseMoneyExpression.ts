export type ParseMoneyExpressionResult = {
  value: number | null;
  isExpression: boolean;
  isValid: boolean;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseSimpleMoneyToken(part: string): number | null {
  const s = part.trim();
  if (!s) return null;

  const commaCount = (s.match(/,/g) ?? []).length;
  const dotCount = (s.match(/\./g) ?? []).length;
  if (commaCount > 1 || dotCount > 1 || (commaCount > 0 && dotCount > 0)) {
    return null;
  }

  const normalized = s.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseMoneyExpression(input: string): ParseMoneyExpressionResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { value: null, isExpression: false, isValid: false };
  }

  if (!trimmed.includes("+")) {
    const value = parseSimpleMoneyToken(trimmed);
    return {
      value,
      isExpression: false,
      isValid: value != null && value > 0
    };
  }

  const parts = trimmed.split("+");
  let sum = 0;

  for (const part of parts) {
    const tokenValue = parseSimpleMoneyToken(part);
    if (tokenValue == null) {
      return { value: null, isExpression: true, isValid: false };
    }
    sum += tokenValue;
  }

  const value = round2(sum);
  return {
    value,
    isExpression: true,
    isValid: value > 0
  };
}
