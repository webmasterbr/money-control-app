import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleFinancialGoalApiError } from "@/lib/financialGoalApi";
import {
  calculateFinancialGoalMetrics,
  serializeFinancialGoal
} from "@/lib/financialGoals";
import { getFinancialGoalsSummary } from "@/services/financialGoalService";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { totalGoals, mainGoal } = await getFinancialGoalsSummary(user.id);

    return NextResponse.json({
      totalGoals,
      mainGoal: mainGoal ? serializeFinancialGoal(mainGoal) : null,
      mainGoalMetrics: mainGoal ? calculateFinancialGoalMetrics(mainGoal) : null
    });
  } catch (error) {
    return handleFinancialGoalApiError(error, "[GOALS_SUMMARY]");
  }
}
