import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { parse } from "date-fns";
import {
  formatDashboardMonthAbbrev,
  previousCompetenceMonth
} from "@/lib/dashboardMonth";
import { getExpenseCategoryLabel } from "@/lib/categories";

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

export type MultiMonthItem = {
  yearMonth: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export type ExpenseReductionSuggestion = {
  categoryId: string | null;
  categoryLabel: string;
  spentAmount: number;
  incomeAmount: number;
  currentPercentOfIncome: number;
  recommendedPercentOfIncome: number;
  targetAmount: number;
  potentialSaving: number;
  message: string;
};

const DEFAULT_RECOMMENDED_PERCENT = 15;
const MIN_POTENTIAL_SAVING = 20;
const FALLBACK_CATEGORY_LABEL = "Outros";

const CATEGORY_LIMITS_RAW: Record<string, number> = {
  Alimentação: 25,
  Transporte: 15,
  Lazer: 10,
  Moradia: 30,
  Saúde: 10,
  Educação: 10,
  Compras: 10,
  Outros: 15
};

function normalizeCategoryLabel(label: string): string {
  return label
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const CATEGORY_LIMITS = new Map<string, number>(
  Object.entries(CATEGORY_LIMITS_RAW).map(([label, percent]) => [
    normalizeCategoryLabel(label),
    percent
  ])
);

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

export async function getExpenseReductionSuggestion(
  userId: string,
  referenceDate: Date
): Promise<ExpenseReductionSuggestion | null> {
  const summary = await getDashboardSummary(userId, referenceDate, {
    fixedListMode: "fullMonth"
  });

  if (summary.incomesTotal <= 0 || summary.expensesByCategory.length === 0) {
    return null;
  }

  let bestSuggestion: ExpenseReductionSuggestion | null = null;

  for (const expense of summary.expensesByCategory) {
    const spentAmount = expense.total;
    if (spentAmount <= 0) continue;

    const categoryId = expense.category?.trim() ? expense.category : null;
    const friendlyLabel = getExpenseCategoryLabel(expense.category);
    const categoryLabel = friendlyLabel?.trim() || FALLBACK_CATEGORY_LABEL;
    const normalizedLabel = normalizeCategoryLabel(categoryLabel);

    const recommendedPercentOfIncome =
      CATEGORY_LIMITS.get(normalizedLabel) ?? DEFAULT_RECOMMENDED_PERCENT;
    const currentPercentOfIncome = (spentAmount / summary.incomesTotal) * 100;

    if (currentPercentOfIncome <= recommendedPercentOfIncome) {
      continue;
    }

    const targetAmount = summary.incomesTotal * (recommendedPercentOfIncome / 100);
    const potentialSaving = spentAmount - targetAmount;

    if (potentialSaving < MIN_POTENTIAL_SAVING) {
      continue;
    }

    const currentPercentRounded = Math.round(currentPercentOfIncome);
    const recommendedPercentRounded = Math.round(recommendedPercentOfIncome);

    const candidate: ExpenseReductionSuggestion = {
      categoryId,
      categoryLabel,
      spentAmount,
      incomeAmount: summary.incomesTotal,
      currentPercentOfIncome,
      recommendedPercentOfIncome,
      targetAmount,
      potentialSaving,
      message: `Você gastou ${currentPercentRounded}% da sua receita com ${categoryLabel} neste mês. Faixa recomendada: até ${recommendedPercentRounded}%.`
    };

    if (
      bestSuggestion === null ||
      candidate.potentialSaving > bestSuggestion.potentialSaving
    ) {
      bestSuggestion = candidate;
    }
  }

  return bestSuggestion;
}

export async function getDashboardMultiMonthSummary(
  userId: string,
  endYearMonth: string,
  months = 6
): Promise<MultiMonthItem[]> {
  if (months <= 0) return [];

  const yearMonths: string[] = [];
  let cursor = endYearMonth;

  for (let i = 0; i < months; i += 1) {
    yearMonths.push(cursor);
    cursor = previousCompetenceMonth(cursor);
  }

  yearMonths.reverse();

  return Promise.all(
    yearMonths.map(async (yearMonth) => {
      const referenceDate = parse(`${yearMonth}-01`, "yyyy-MM-dd", new Date());
      const summary = await getDashboardSummary(userId, referenceDate, {
        fixedListMode: "fullMonth"
      });

      return {
        yearMonth,
        label: formatDashboardMonthAbbrev(yearMonth),
        income: summary.incomesTotal,
        expense: summary.expensesTotal,
        balance: summary.balance
      };
    })
  );
}
