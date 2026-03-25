import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseYearMonthListQuery } from "@/lib/dashboardMonth";
import { incomeSchema } from "@/lib/validation";
import { createIncome, listIncomes } from "@/services/incomeService";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = parseYearMonthListQuery(
    request.nextUrl.searchParams.get("month")
  );

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const incomes = await listIncomes(user.id, {
    yearMonth: parsed.yearMonth
  });
  return NextResponse.json({ incomes });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = incomeSchema.safeParse({
      ...body,
      amount: typeof body.amount === "string" ? parseFloat(body.amount) : body.amount
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const income = await createIncome(user.id, parsed.data);
    return NextResponse.json({ income }, { status: 201 });
  } catch (error) {
    console.error("[INCOMES_POST]", error);
    return NextResponse.json(
      { error: "Erro ao criar receita" },
      { status: 500 }
    );
  }
}

