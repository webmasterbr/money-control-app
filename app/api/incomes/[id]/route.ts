import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { incomeSchema } from "@/lib/validation";
import { deleteIncome, updateIncome } from "@/services/incomeService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = incomeSchema.partial().safeParse({
      ...body,
      amount:
        typeof body.amount === "string"
          ? parseFloat(body.amount)
          : body.amount
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const income = await updateIncome(user.id, id, parsed.data);
    return NextResponse.json({ income });
  } catch (error) {
    console.error("[INCOMES_PUT]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar receita" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await deleteIncome(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INCOMES_DELETE]", error);
    return NextResponse.json(
      { error: "Erro ao excluir receita" },
      { status: 500 }
    );
  }
}

