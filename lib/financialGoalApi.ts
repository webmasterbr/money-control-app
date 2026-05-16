import { NextResponse } from "next/server";
import { toNumber } from "@/lib/financialGoals";
import { ZodError } from "zod";

export function coerceMoneyField(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return toNumber(value as string | number);
}

export function handleFinancialGoalApiError(
  error: unknown,
  logTag: string
): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", details: error.flatten() },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    if (error.message === "Meta não encontrada") {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(logTag, error);
  return NextResponse.json(
    { error: "Erro interno do servidor" },
    { status: 500 }
  );
}
