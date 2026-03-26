import { Prisma } from "@prisma/client";
import {
  isValidCompetenceMonth,
  previousCompetenceMonth
} from "@/lib/dashboardMonth";
import {
  clampDateInputToCompetenceMonth,
  competenceMonthFromDateInput,
  dateInputToLocalDate,
  dateStringForCompetenceAndDueDay
} from "@/lib/expenseCompetence";
import { prisma } from "@/lib/prisma";
import type { ExpenseInput } from "@/lib/validation";

function normalizeDateInput(date: string | Date): string {
  if (typeof date === "string") {
    const ymd = date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      throw new Error("Data inválida");
    }
    return ymd;
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function listExpenses(
  userId: string,
  filters: { competenceMonth: string }
) {
  return prisma.expense.findMany({
    where: {
      userId,
      competenceMonth: filters.competenceMonth
    },
    orderBy: { date: "desc" }
  });
}

export async function createExpense(
  userId: string,
  data: ExpenseInput & { competenceMonth?: string }
) {
  const inputDate = normalizeDateInput(data.date);
  const requestedCompetenceMonth =
    data.competenceMonth ?? competenceMonthFromDateInput(inputDate);
  const normalizedDateInput = clampDateInputToCompetenceMonth(
    inputDate,
    requestedCompetenceMonth
  );

  return prisma.expense.create({
    data: {
      userId,
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: dateInputToLocalDate(normalizedDateInput),
      isFixed: data.isFixed,
      dueDay: data.dueDay,
      competenceMonth: requestedCompetenceMonth
    }
  });
}

type ExpenseUpdatePayload = Partial<
  Omit<ExpenseInput, "dueDay"> & { dueDay: number | null; competenceMonth?: string }
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
  if (data.date !== undefined) {
    const inputDate = normalizeDateInput(data.date);
    const targetCompetenceMonth =
      data.competenceMonth ?? competenceMonthFromDateInput(inputDate);
    const normalizedDateInput = clampDateInputToCompetenceMonth(
      inputDate,
      targetCompetenceMonth
    );
    prismaData.date = dateInputToLocalDate(normalizedDateInput);
    prismaData.competenceMonth = targetCompetenceMonth;
  }
  if (data.isFixed !== undefined) prismaData.isFixed = data.isFixed;

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

export async function importFixedExpenses(
  userId: string,
  currentMonth: string
): Promise<{ imported: number; skipped: number }> {
  if (!isValidCompetenceMonth(currentMonth)) {
    throw new Error("Mês inválido");
  }

  const previousMonth = previousCompetenceMonth(currentMonth);

  return prisma.$transaction(async (tx) => {
    const previousFixed = await tx.expense.findMany({
      where: {
        userId,
        competenceMonth: previousMonth,
        isFixed: true
      }
    });

    const currentRows = await tx.expense.findMany({
      where: { userId, competenceMonth: currentMonth },
      select: { sourceExpenseId: true }
    });

    const rootsInTarget = new Set(
      currentRows
        .map((e) => e.sourceExpenseId)
        .filter((id): id is string => id !== null)
    );

    let imported = 0;
    let skipped = 0;

    for (const exp of previousFixed) {
      const rootId = exp.sourceExpenseId ?? exp.id;
      if (rootsInTarget.has(rootId)) {
        skipped++;
        continue;
      }

      const dueDayForDate = exp.dueDay ?? 1;
      const dateStr = dateStringForCompetenceAndDueDay(
        currentMonth,
        dueDayForDate
      );

      try {
        const [y, mo, d] = dateStr.split("-").map(Number);
        await tx.expense.create({
          data: {
            userId,
            amount: exp.amount,
            category: exp.category,
            description: exp.description,
            date: new Date(y, mo - 1, d),
            isFixed: true,
            dueDay: exp.dueDay,
            competenceMonth: currentMonth,
            sourceExpenseId: rootId
          }
        });
        rootsInTarget.add(rootId);
        imported++;
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          rootsInTarget.add(rootId);
          skipped++;
        } else {
          throw e;
        }
      }
    }

    return { imported, skipped };
  });
}

