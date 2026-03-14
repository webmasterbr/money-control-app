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

export async function updateExpense(
  userId: string,
  expenseId: string,
  data: Partial<ExpenseInput>
) {
  return prisma.expense.update({
    where: {
      id: expenseId,
      userId
    },
    data: {
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: data.date ? new Date(data.date) : undefined,
      isFixed: data.isFixed,
      dueDay: data.dueDay,
      competenceMonth: data.competenceMonth
    }
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

