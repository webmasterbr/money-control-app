import { prisma } from "@/lib/prisma";
import type { ExpenseInput } from "@/lib/validation";

export async function listExpenses(userId: string) {
  return prisma.expense.findMany({
    where: { userId },
    orderBy: { date: "desc" }
  });
}

export async function createExpense(userId: string, data: ExpenseInput) {
  return prisma.expense.create({
    data: {
      userId,
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: new Date(data.date),
      isFixed: data.isFixed,
      dueDay: data.dueDay,
      competenceMonth: data.competenceMonth
    }
  });
}

type ExpenseUpdatePayload = Partial<
  Omit<ExpenseInput, "dueDay"> & { dueDay: number | null }
>;

export async function updateExpense(
  userId: string,
  expenseId: string,
  data: ExpenseUpdatePayload
) {
  const prismaData: Parameters<typeof prisma.expense.update>[0]["data"] = {};

  if (data.amount !== undefined) prismaData.amount = data.amount;
  if (data.category !== undefined) prismaData.category = data.category;
  if (data.description !== undefined) {
    prismaData.description = data.description || null;
  }
  if (data.date !== undefined) prismaData.date = new Date(data.date);
  if (data.isFixed !== undefined) prismaData.isFixed = data.isFixed;
  if (data.competenceMonth !== undefined) {
    prismaData.competenceMonth = data.competenceMonth;
  }

  if (data.isFixed === false) {
    prismaData.dueDay = null;
  } else if (data.dueDay !== undefined) {
    prismaData.dueDay = data.dueDay;
  }

  return prisma.expense.update({
    where: {
      id: expenseId,
      userId
    },
    data: prismaData
  });
}

export async function deleteExpense(userId: string, expenseId: string) {
  return prisma.expense.delete({
    where: {
      id: expenseId,
      userId
    }
  });
}

