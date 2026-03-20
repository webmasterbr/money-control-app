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

export async function getDashboardSummary(
  userId: string,
  referenceDate = new Date()
): Promise<DashboardSummary> {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const [
    incomesAgg,
    expensesAgg,
    fixedExpenses,
    expensesGrouped,
    incomesGrouped
  ] = await Promise.all([
      prisma.income.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }),
      prisma.expense.findMany({
        where: {
          userId,
          isFixed: true,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        orderBy: {
          dueDay: "asc"
        }
      }),
      prisma.expense.groupBy({
        by: ["category"],
        _sum: {
          amount: true
        },
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }),
      prisma.income.groupBy({
        by: ["category"],
        _sum: {
          amount: true
        },
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })
    ]);

  const incomesTotal = Number(incomesAgg._sum.amount ?? 0);
  const expensesTotal = Number(expensesAgg._sum.amount ?? 0);
  const balance = incomesTotal - expensesTotal;

  const fixedExpensesTotal = fixedExpenses.reduce(
    (acc, exp) => acc + Number(exp.amount),
    0
  );

  const today = referenceDate.getDate();
  const upcomingFixedExpenses = fixedExpenses.filter((exp) => {
    if (exp.dueDay == null) return false;
    return exp.dueDay >= today && exp.dueDay <= today + 7;
  });

  const expensesByCategory = expensesGrouped.map((g) => ({
    category: g.category,
    total: Number(g._sum.amount ?? 0)
  }));

  const incomesByCategory = incomesGrouped.map((g) => ({
    category: g.category,
    total: Number(g._sum.amount ?? 0)
  }));

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

