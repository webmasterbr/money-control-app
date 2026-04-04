import { endOfMonth, startOfMonth } from "date-fns";
import {
  clampDateInputToCompetenceMonth,
  dateInputToLocalDate
} from "@/lib/expenseCompetence";
import { prisma } from "@/lib/prisma";
import type { IncomeInput } from "@/lib/validation";

function normalizeDateInput(date: string | Date): string {
  if (typeof date === "string") {
    const ymd = date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      throw new Error("Data inválida");
    }
    return ymd;
  }
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

export async function createIncome(
  userId: string,
  data: IncomeInput & { competenceMonth?: string }
) {
  const inputDate = normalizeDateInput(data.date);
  const normalizedDateInput = data.competenceMonth
    ? clampDateInputToCompetenceMonth(inputDate, data.competenceMonth)
    : inputDate;

  return prisma.income.create({
    data: {
      userId,
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: dateInputToLocalDate(normalizedDateInput)
    }
  });
}

export async function updateIncome(
  userId: string,
  incomeId: string,
  data: Partial<IncomeInput> & { competenceMonth?: string }
) {
  const normalizedDateInput = data.date
    ? data.competenceMonth
      ? clampDateInputToCompetenceMonth(
          normalizeDateInput(data.date),
          data.competenceMonth
        )
      : normalizeDateInput(data.date)
    : undefined;

  return prisma.income.update({
    where: {
      id: incomeId,
      userId
    },
    data: {
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: normalizedDateInput
        ? dateInputToLocalDate(normalizedDateInput)
        : undefined
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

