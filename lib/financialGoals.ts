import { Decimal } from "@prisma/client/runtime/library";
import { differenceInCalendarMonths } from "date-fns";
import type { FinancialGoal } from "@prisma/client";

export type FinancialGoalStatus = "completed" | "overdue" | "in_progress";

export type FinancialGoalMetrics = {
  progressPercent: number;
  progressPercentCapped: number;
  remainingAmount: number;
  monthlyNeeded: number | null;
  status: FinancialGoalStatus;
};

export type FinancialGoalAmountInput = {
  targetAmount: number | string | Decimal;
  currentAmount: number | string | Decimal;
  deadline?: Date | null;
};

export type CreateFinancialGoalInput = {
  name: string;
  targetAmount: number | string;
  currentAmount?: number | string;
  deadline?: Date | string | null;
};

export type UpdateFinancialGoalInput = Partial<CreateFinancialGoalInput>;

export type FinancialGoalsSummary = {
  totalGoals: number;
  mainGoal: FinancialGoal | null;
};

export type FinancialGoalSummaryCandidate = Pick<
  FinancialGoal,
  "id" | "name" | "targetAmount" | "currentAmount" | "deadline" | "createdAt"
>;

type NumericInput = number | string | Decimal;

export function toNumber(value: NumericInput): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Valor inválido");
    }
    return value;
  }

  try {
    const n = new Decimal(value).toNumber();
    if (!Number.isFinite(n)) {
      throw new Error("Valor inválido");
    }
    return n;
  } catch {
    throw new Error("Valor inválido");
  }
}

export function calculateFinancialGoalMetrics(
  goal: FinancialGoalAmountInput
): FinancialGoalMetrics {
  const targetAmount = toNumber(goal.targetAmount);
  const currentAmount = toNumber(goal.currentAmount);
  const deadline = goal.deadline ?? null;

  const progressPercent =
    targetAmount <= 0 ? 0 : (currentAmount / targetAmount) * 100;
  const progressPercentCapped = Math.min(100, Math.max(0, progressPercent));
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);

  let status: FinancialGoalStatus;
  if (currentAmount >= targetAmount) {
    status = "completed";
  } else if (deadline && deadline < new Date()) {
    status = "overdue";
  } else {
    status = "in_progress";
  }

  let monthlyNeeded: number | null = null;
  if (
    deadline &&
    status !== "completed" &&
    remainingAmount > 0 &&
    deadline > new Date()
  ) {
    const monthsLeft = Math.max(
      1,
      differenceInCalendarMonths(deadline, new Date())
    );
    monthlyNeeded = remainingAmount / monthsLeft;
  }

  return {
    progressPercent,
    progressPercentCapped,
    remainingAmount,
    monthlyNeeded,
    status
  };
}

export type SerializedFinancialGoal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinancialGoalWithMetricsResponse = {
  goal: SerializedFinancialGoal;
  metrics: FinancialGoalMetrics;
};

export function serializeFinancialGoal(
  goal: FinancialGoal
): SerializedFinancialGoal {
  return {
    id: goal.id,
    userId: goal.userId,
    name: goal.name,
    targetAmount: toNumber(goal.targetAmount),
    currentAmount: toNumber(goal.currentAmount),
    deadline: goal.deadline?.toISOString() ?? null,
    isArchived: goal.isArchived,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString()
  };
}

export function goalWithMetricsResponse(
  goal: FinancialGoal
): FinancialGoalWithMetricsResponse {
  return {
    goal: serializeFinancialGoal(goal),
    metrics: calculateFinancialGoalMetrics(goal)
  };
}
