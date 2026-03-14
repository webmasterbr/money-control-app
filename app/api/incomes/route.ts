import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { incomeSchema } from "@/lib/validation";
import { createIncome, listIncomes } from "@/services/incomeService";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const incomes = await listIncomes(user.id);
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

