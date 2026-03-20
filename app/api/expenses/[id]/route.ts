import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation";
import { deleteExpense, updateExpense } from "@/services/expenseService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const expensePartialWithoutDueDay = expenseSchema.partial().omit({ dueDay: true });

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const amountParsed =
      body.amount === undefined
        ? undefined
        : typeof body.amount === "string"
          ? parseFloat(body.amount)
          : body.amount;

    const parsed = expensePartialWithoutDueDay.safeParse({
      ...body,
      amount: amountParsed
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const isFixed = parsed.data.isFixed ?? body.isFixed;
    let dueDay: number | null | undefined;
    if (isFixed === false) {
      dueDay = null;
    } else if (isFixed === true) {
      if (
        body.dueDay === null ||
        body.dueDay === "" ||
        body.dueDay === undefined
      ) {
        dueDay = null;
      } else {
        dueDay = Number(body.dueDay);
      }
    }

    const expense = await updateExpense(user.id, id, {
      ...parsed.data,
      ...(dueDay !== undefined || isFixed === false ? { dueDay } : {})
    });

    return NextResponse.json({ expense });
  } catch (error) {
    console.error("[EXPENSES_PUT]", error);
    return NextResponse.json(
      { error: "Erro ao atualizar despesa" },
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
    await deleteExpense(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EXPENSES_DELETE]", error);
    return NextResponse.json(
      { error: "Erro ao excluir despesa" },
      { status: 500 }
    );
  }
}
