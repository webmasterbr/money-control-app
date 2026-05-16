import { Prisma } from "@prisma/client";
import { dateInputToStoredDate } from "@/lib/calendarDate";
import {
  type CreateFinancialGoalInput,
  type FinancialGoalSummaryCandidate,
  type FinancialGoalsSummary,
  type UpdateFinancialGoalInput,
  toNumber
} from "@/lib/financialGoals";
import { prisma } from "@/lib/prisma";

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Nome é obrigatório");
  }
  return trimmed;
}

function normalizeAmount(
  value: number | string,
  options: { positive?: boolean; nonNegative?: boolean }
): number {
  const n = toNumber(value);

  if (options.positive && n <= 0) {
    throw new Error("Valor deve ser maior que zero");
  }

  if (options.nonNegative && n < 0) {
    throw new Error("Valor não pode ser negativo");
  }

  return n;
}

function normalizeDeadline(
  deadline?: Date | string | null
): Date | null | undefined {
  if (deadline === undefined) {
    return undefined;
  }

  if (deadline === null) {
    return null;
  }

  if (deadline instanceof Date) {
    if (Number.isNaN(deadline.getTime())) {
      throw new Error("Data inválida");
    }
    return deadline;
  }

  if (typeof deadline === "string") {
    const ymd = deadline.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      throw new Error("Data inválida");
    }
    return dateInputToStoredDate(ymd);
  }

  throw new Error("Data inválida");
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

function sortGoalsByDeadlineThenCreatedAt<
  T extends { deadline: Date | null; createdAt: Date }
>(goals: T[]): T[] {
  return [...goals].sort((a, b) => {
    if (a.deadline && b.deadline) {
      const diff = a.deadline.getTime() - b.deadline.getTime();
      if (diff !== 0) return diff;
    } else if (a.deadline && !b.deadline) {
      return -1;
    } else if (!a.deadline && b.deadline) {
      return 1;
    }

    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

function pickMainGoalFromCandidates(
  candidates: FinancialGoalSummaryCandidate[]
): FinancialGoalSummaryCandidate | null {
  const incomplete = candidates.filter(
    (g) => toNumber(g.currentAmount) < toNumber(g.targetAmount)
  );

  if (incomplete.length === 0) {
    return null;
  }

  const withDeadline = incomplete
    .filter((g) => g.deadline !== null)
    .sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime());

  if (withDeadline.length > 0) {
    return withDeadline[0];
  }

  const withoutDeadline = incomplete
    .filter((g) => g.deadline === null)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return withoutDeadline[0] ?? null;
}

export async function getFinancialGoals(userId: string) {
  const goals = await prisma.financialGoal.findMany({
    where: {
      userId,
      isArchived: false
    },
    orderBy: [{ createdAt: "asc" }]
  });

  return sortGoalsByDeadlineThenCreatedAt(goals);
}

export async function getFinancialGoalById(userId: string, goalId: string) {
  return prisma.financialGoal.findFirst({
    where: {
      id: goalId,
      userId,
      isArchived: false
    }
  });
}

export async function createFinancialGoal(
  userId: string,
  data: CreateFinancialGoalInput
) {
  const name = normalizeName(data.name);
  const targetAmount = normalizeAmount(data.targetAmount, { positive: true });
  const currentAmount =
    data.currentAmount !== undefined
      ? normalizeAmount(data.currentAmount, { nonNegative: true })
      : 0;
  const deadline = normalizeDeadline(data.deadline) ?? null;

  return prisma.financialGoal.create({
    data: {
      userId,
      name,
      targetAmount,
      currentAmount,
      deadline
    }
  });
}

export async function updateFinancialGoal(
  userId: string,
  goalId: string,
  data: UpdateFinancialGoalInput
) {
  const prismaData: Prisma.FinancialGoalUpdateInput = {};

  if (data.name !== undefined) {
    prismaData.name = normalizeName(data.name);
  }

  if (data.targetAmount !== undefined) {
    prismaData.targetAmount = normalizeAmount(data.targetAmount, {
      positive: true
    });
  }

  if (data.currentAmount !== undefined) {
    prismaData.currentAmount = normalizeAmount(data.currentAmount, {
      nonNegative: true
    });
  }

  if (data.deadline !== undefined) {
    prismaData.deadline = normalizeDeadline(data.deadline) ?? null;
  }

  try {
    return await prisma.financialGoal.update({
      where: {
        id: goalId,
        userId,
        isArchived: false
      },
      data: prismaData
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error("Meta não encontrada");
    }
    throw error;
  }
}

export async function deleteFinancialGoal(userId: string, goalId: string) {
  try {
    return await prisma.financialGoal.update({
      where: {
        id: goalId,
        userId,
        isArchived: false
      },
      data: {
        isArchived: true
      }
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error("Meta não encontrada");
    }
    throw error;
  }
}

export async function addAmountToFinancialGoal(
  userId: string,
  goalId: string,
  amount: number | string
) {
  const normalizedAmount = normalizeAmount(amount, { positive: true });

  try {
    return await prisma.financialGoal.update({
      where: {
        id: goalId,
        userId,
        isArchived: false
      },
      data: {
        currentAmount: {
          increment: normalizedAmount
        }
      }
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error("Meta não encontrada");
    }
    throw error;
  }
}

export async function getFinancialGoalsSummary(
  userId: string
): Promise<FinancialGoalsSummary> {
  const [totalGoals, candidates] = await Promise.all([
    prisma.financialGoal.count({
      where: {
        userId,
        isArchived: false
      }
    }),
    prisma.financialGoal.findMany({
      where: {
        userId,
        isArchived: false
      },
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        deadline: true,
        createdAt: true,
        userId: true,
        isArchived: true,
        updatedAt: true
      }
    })
  ]);

  const picked = pickMainGoalFromCandidates(candidates);
  const mainGoal = picked
    ? candidates.find((goal) => goal.id === picked.id) ?? null
    : null;

  return { totalGoals, mainGoal };
}
