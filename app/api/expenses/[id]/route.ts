import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation";
import { deleteExpense, updateExpense } from "@/services/expenseService";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = expenseSchema.partial().safeParse({
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

    const expense = await updateExpense(user.id, params.id, parsed.data);
    return NextResponse.json({ expense });
  } catch (error) {
    console.error("[EXPENSES_PUT]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar despesa" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await deleteExpense(user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EXPENSES_DELETE]", error);
    return NextResponse.json(
      { error: "Erro ao excluir despesa" },
      { status: 500 }
    );
  }
}

