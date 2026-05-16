import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  coerceMoneyField,
  handleFinancialGoalApiError
} from "@/lib/financialGoalApi";
import { goalWithMetricsResponse } from "@/lib/financialGoals";
import { updateFinancialGoalSchema } from "@/lib/validation";
import {
  deleteFinancialGoal,
  getFinancialGoalById,
  updateFinancialGoal
} from "@/services/financialGoalService";

type RouteContext = {
  params: Promise<{ goalId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { goalId } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const goal = await getFinancialGoalById(user.id, goalId);

    if (!goal) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(goalWithMetricsResponse(goal));
  } catch (error) {
    return handleFinancialGoalApiError(error, "[GOALS_GET_ID]");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { goalId } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateFinancialGoalSchema.safeParse({
      name: body.name,
      targetAmount:
        body.targetAmount !== undefined
          ? coerceMoneyField(body.targetAmount)
          : undefined,
      currentAmount:
        body.currentAmount !== undefined
          ? coerceMoneyField(body.currentAmount)
          : undefined,
      deadline: body.deadline
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const goal = await updateFinancialGoal(user.id, goalId, parsed.data);
    return NextResponse.json(goalWithMetricsResponse(goal));
  } catch (error) {
    return handleFinancialGoalApiError(error, "[GOALS_PATCH]");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { goalId } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await deleteFinancialGoal(user.id, goalId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleFinancialGoalApiError(error, "[GOALS_DELETE]");
  }
}
