import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { importFixedExpensesSchema } from "@/lib/validation";
import { importFixedExpenses } from "@/services/expenseService";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = importFixedExpensesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await importFixedExpenses(user.id, parsed.data.month);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Mês inválido") {
      return NextResponse.json({ error: "Mês inválido" }, { status: 400 });
    }
    console.error("[EXPENSES_IMPORT_FIXED_POST]", error);
    return NextResponse.json(
      { error: "Erro ao importar despesas fixas" },
      { status: 500 }
    );
  }
}
