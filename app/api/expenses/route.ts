import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseExpenseListMonthParam } from "@/lib/dashboardMonth";
import { expenseSchema } from "@/lib/validation";
import { createExpense, listExpenses } from "@/services/expenseService";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const monthParsed = parseExpenseListMonthParam(
    request.nextUrl.searchParams.get("month")
  );

  if ("error" in monthParsed) {
    return NextResponse.json({ error: monthParsed.error }, { status: 400 });
  }

  const expenses = await listExpenses(user.id, {
    competenceMonth: monthParsed.competenceMonth
  });
  return NextResponse.json({ expenses });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = expenseSchema.safeParse({
      ...body,
      amount: typeof body.amount === "string" ? parseFloat(body.amount) : body.amount,
      isFixed: body.isFixed ?? false,
      dueDay:
        body.dueDay === null || body.dueDay === ""
          ? undefined
          : body.dueDay
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const expense = await createExpense(user.id, parsed.data);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("[EXPENSES_POST]", error);
    return NextResponse.json(
      { error: "Erro ao criar despesa" },
      { status: 500 }
    );
  }
}

