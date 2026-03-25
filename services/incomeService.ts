import { endOfMonth, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { IncomeInput } from "@/lib/validation";

export async function listIncomes(
  userId: string,
  filters: { yearMonth: string }
) {
  const [y, m] = filters.yearMonth.split("-").map(Number);
  const anchor = new Date(y, m - 1, 1);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);

  return prisma.income.findMany({
    where: {
      userId,
      date: {
        gte: monthStart,
        lte: monthEnd
      }
    },
    orderBy: { date: "desc" }
  });
}

export async function createIncome(userId: string, data: IncomeInput) {
  return prisma.income.create({
    data: {
      userId,
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: new Date(data.date)
    }
  });
}

export async function updateIncome(
  userId: string,
  incomeId: string,
  data: Partial<IncomeInput>
) {
  return prisma.income.update({
    where: {
      id: incomeId,
      userId
    },
    data: {
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: data.date ? new Date(data.date) : undefined
    }
  });
}

export async function deleteIncome(userId: string, incomeId: string) {
  return prisma.income.delete({
    where: {
      id: incomeId,
      userId
    }
  });
}

