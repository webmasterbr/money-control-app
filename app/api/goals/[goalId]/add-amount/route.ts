import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  coerceMoneyField,
  handleFinancialGoalApiError
} from "@/lib/financialGoalApi";
import { goalWithMetricsResponse } from "@/lib/financialGoals";
import { addAmountToFinancialGoalSchema } from "@/lib/validation";
import { addAmountToFinancialGoal } from "@/services/financialGoalService";

type RouteContext = {
  params: Promise<{ goalId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { goalId } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = addAmountToFinancialGoalSchema.safeParse({
      amount: coerceMoneyField(body.amount)
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const goal = await addAmountToFinancialGoal(
      user.id,
      goalId,
      parsed.data.amount
    );
    return NextResponse.json(goalWithMetricsResponse(goal));
  } catch (error) {
    return handleFinancialGoalApiError(error, "[GOALS_ADD_AMOUNT]");
  }
}
