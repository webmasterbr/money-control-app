import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export type DashboardSummary = {
  incomesTotal: number;
  expensesTotal: number;
  balance: number;
  fixedExpensesTotal: number;
  upcomingFixedExpenses: {
    id: string;
    description: string | null;
    category: string;
    amount: number;
    dueDay: number | null;
    competenceMonth: string;
  }[];
  expensesByCategory: {
    category: string;
    total: number;
  }[];
  incomesByCategory: {
    category: string;
    total: number;
  }[];
};

export type FixedExpensesListMode = "next7Days" | "fullMonth";

export async function getDashboardSummary(
  userId: string,
  referenceDate = new Date(),
  options?: { fixedListMode?: FixedExpensesListMode }
): Promise<DashboardSummary> {
  const fixedListMode: FixedExpensesListMode =
    options?.fixedListMode ?? "next7Days";
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const [monthExpenses, monthIncomes] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      select: {
        amount: true,
        category: true,
        isFixed: true,
        dueDay: true,
        id: true,
        description: true,
        competenceMonth: true
      }
    }),
    prisma.income.findMany({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      select: {
        category: true,
        amount: true
      }
    })
  ]);

  let expensesTotal = 0;
  const expenseCategoryTotals = new Map<string, number>();
  for (const row of monthExpenses) {
    const amt = Number(row.amount);
    expensesTotal += amt;
    expenseCategoryTotals.set(
      row.category,
      (expenseCategoryTotals.get(row.category) ?? 0) + amt
    );
  }

  let incomesTotal = 0;
  const incomeCategoryTotals = new Map<string, number>();
  for (const row of monthIncomes) {
    const amt = Number(row.amount);
    incomesTotal += amt;
    incomeCategoryTotals.set(
      row.category,
      (incomeCategoryTotals.get(row.category) ?? 0) + amt
    );
  }

  const balance = incomesTotal - expensesTotal;

  const fixedExpenses = monthExpenses.filter((e) => e.isFixed);
  const fixedExpensesTotal = fixedExpenses.reduce(
    (acc, exp) => acc + Number(exp.amount),
    0
  );

  const today = referenceDate.getDate();
  const upcomingFixedExpenses =
    fixedListMode === "fullMonth"
      ? [...fixedExpenses].sort((a, b) => {
          if (a.dueDay == null && b.dueDay == null) return 0;
          if (a.dueDay == null) return 1;
          if (b.dueDay == null) return -1;
          return a.dueDay - b.dueDay;
        })
      : fixedExpenses.filter((exp) => {
          if (exp.dueDay == null) return false;
          return exp.dueDay >= today && exp.dueDay <= today + 7;
        });

  const expensesByCategory = Array.from(
    expenseCategoryTotals.entries()
  ).map(([category, total]) => ({ category, total }));

  const incomesByCategory = Array.from(incomeCategoryTotals.entries()).map(
    ([category, total]) => ({ category, total })
  );

  return {
    incomesTotal,
    expensesTotal,
    balance,
    fixedExpensesTotal,
    upcomingFixedExpenses: upcomingFixedExpenses.map((exp) => ({
      id: exp.id,
      description: exp.description,
      category: exp.category,
      amount: Number(exp.amount),
      dueDay: exp.dueDay,
      competenceMonth: exp.competenceMonth
    })),
    expensesByCategory,
    incomesByCategory
  };
}
