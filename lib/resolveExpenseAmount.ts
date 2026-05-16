import { parseCurrencyInput } from "@/lib/currency";
import { parseMoneyExpression } from "@/lib/parseMoneyExpression";

export type ResolveExpenseAmountResult = {
  value: number | null;
  isValid: boolean;
};

export function resolveExpenseAmount(
  amountStr: string
): ResolveExpenseAmountResult {
  if (amountStr.includes("+")) {
    const result = parseMoneyExpression(amountStr);

    return {
      value: result.value,
      isValid: result.isValid && result.value != null && result.value > 0
    };
  }

  const value = parseCurrencyInput(amountStr);

  return {
    value,
    isValid: value > 0
  };
}
