import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  coerceMoneyField,
  handleFinancialGoalApiError
} from "@/lib/financialGoalApi";
import { goalWithMetricsResponse } from "@/lib/financialGoals";
import { createFinancialGoalSchema } from "@/lib/validation";
import {
  createFinancialGoal,
  getFinancialGoals
} from "@/services/financialGoalService";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const goals = await getFinancialGoals(user.id);
    return NextResponse.json({
      goals: goals.map((goal) => goalWithMetricsResponse(goal))
    });
  } catch (error) {
    return handleFinancialGoalApiError(error, "[GOALS_GET]");
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createFinancialGoalSchema.safeParse({
      name: body.name,
      targetAmount: coerceMoneyField(body.targetAmount),
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

    const goal = await createFinancialGoal(user.id, parsed.data);
    return NextResponse.json(goalWithMetricsResponse(goal), { status: 201 });
  } catch (error) {
    return handleFinancialGoalApiError(error, "[GOALS_POST]");
  }
}
