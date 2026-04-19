import { prisma } from "@/lib/prisma";
import { endOfMonth, format, parse, startOfMonth } from "date-fns";
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

export type DashboardBundle = {
  summary: DashboardSummary;
  prevSummary: DashboardSummary;
  multiMonthItems: MultiMonthItem[];
  suggestion: ExpenseReductionSuggestion | null;
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

type ExpenseWindowRow = {
  id: string;
  amount: number;
  category: string;
  isFixed: boolean;
  dueDay: number | null;
  description: string | null;
  competenceMonth: string;
  date: Date;
};

type IncomeWindowRow = {
  amount: number;
  category: string;
  date: Date;
};

const CATEGORY_LIMITS = new Map<string, number>(
  Object.entries(CATEGORY_LIMITS_RAW).map(([label, percent]) => [
    normalizeCategoryLabel(label),
    percent
  ])
);

function buildYearMonths(endYearMonth: string, months: number): string[] {
  if (months <= 0) return [];

  const yearMonths: string[] = [];
  let cursor = endYearMonth;
  for (let i = 0; i < months; i += 1) {
    yearMonths.push(cursor);
    cursor = previousCompetenceMonth(cursor);
  }

  yearMonths.reverse();
  return yearMonths;
}

function isCompetenceMonth(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

function resolveExpenseYearMonth(expense: ExpenseWindowRow): string {
  if (isCompetenceMonth(expense.competenceMonth)) {
    return expense.competenceMonth;
  }
  return format(expense.date, "yyyy-MM");
}

async function getDashboardWindowData(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<{ expenses: ExpenseWindowRow[]; incomes: IncomeWindowRow[] }> {
  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: rangeStart,
          lte: rangeEnd
        }
      },
      select: {
        id: true,
        amount: true,
        category: true,
        isFixed: true,
        dueDay: true,
        description: true,
        competenceMonth: true,
        date: true
      }
    }),
    prisma.income.findMany({
      where: {
        userId,
        date: {
          gte: rangeStart,
          lte: rangeEnd
        }
      },
      select: {
        amount: true,
        category: true,
        date: true
      }
    })
  ]);

  return {
    expenses: expenses.map((expense) => ({
      id: expense.id,
      amount: Number(expense.amount),
      category: expense.category,
      isFixed: expense.isFixed,
      dueDay: expense.dueDay,
      description: expense.description,
      competenceMonth: expense.competenceMonth,
      date: expense.date
    })),
    incomes: incomes.map((income) => ({
      amount: Number(income.amount),
      category: income.category,
      date: income.date
    }))
  };
}

function groupRowsByYearMonth(
  expenses: ExpenseWindowRow[],
  incomes: IncomeWindowRow[]
): {
  expensesByYearMonth: Map<string, ExpenseWindowRow[]>;
  incomesByYearMonth: Map<string, IncomeWindowRow[]>;
} {
  const expensesByYearMonth = new Map<string, ExpenseWindowRow[]>();
  const incomesByYearMonth = new Map<string, IncomeWindowRow[]>();

  for (const expense of expenses) {
    const yearMonth = resolveExpenseYearMonth(expense);
    const rows = expensesByYearMonth.get(yearMonth) ?? [];
    rows.push(expense);
    expensesByYearMonth.set(yearMonth, rows);
  }

  for (const income of incomes) {
    const yearMonth = format(income.date, "yyyy-MM");
    const rows = incomesByYearMonth.get(yearMonth) ?? [];
    rows.push(income);
    incomesByYearMonth.set(yearMonth, rows);
  }

  return { expensesByYearMonth, incomesByYearMonth };
}

function buildSummaryFromRows(
  referenceDate: Date,
  monthExpenses: ExpenseWindowRow[],
  monthIncomes: IncomeWindowRow[],
  options?: { fixedListMode?: FixedExpensesListMode }
): DashboardSummary {
  const fixedListMode: FixedExpensesListMode =
    options?.fixedListMode ?? "next7Days";

  let expensesTotal = 0;
  const expenseCategoryTotals = new Map<string, number>();
  for (const row of monthExpenses) {
    const amt = row.amount;
    expensesTotal += amt;
    expenseCategoryTotals.set(
      row.category,
      (expenseCategoryTotals.get(row.category) ?? 0) + amt
    );
  }

  let incomesTotal = 0;
  const incomeCategoryTotals = new Map<string, number>();
  for (const row of monthIncomes) {
    const amt = row.amount;
    incomesTotal += amt;
    incomeCategoryTotals.set(
      row.category,
      (incomeCategoryTotals.get(row.category) ?? 0) + amt
    );
  }

  const balance = incomesTotal - expensesTotal;

  const fixedExpenses = monthExpenses.filter((expense) => expense.isFixed);
  const fixedExpensesTotal = fixedExpenses.reduce(
    (acc, expense) => acc + expense.amount,
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
      : fixedExpenses.filter((expense) => {
          if (expense.dueDay == null) return false;
          return expense.dueDay >= today && expense.dueDay <= today + 7;
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
    upcomingFixedExpenses: upcomingFixedExpenses.map((expense) => ({
      id: expense.id,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      dueDay: expense.dueDay,
      competenceMonth: expense.competenceMonth
    })),
    expensesByCategory,
    incomesByCategory
  };
}

export async function getDashboardSummary(
  userId: string,
  referenceDate = new Date(),
  options?: { fixedListMode?: FixedExpensesListMode }
): Promise<DashboardSummary> {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const { expenses, incomes } = await getDashboardWindowData(
    userId,
    monthStart,
    monthEnd
  );

  return buildSummaryFromRows(referenceDate, expenses, incomes, options);
}

export function getExpenseReductionSuggestionFromSummary(
  summary: DashboardSummary
): ExpenseReductionSuggestion | null {
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

export async function getExpenseReductionSuggestion(
  userId: string,
  referenceDate: Date
): Promise<ExpenseReductionSuggestion | null> {
  const summary = await getDashboardSummary(userId, referenceDate, {
    fixedListMode: "fullMonth"
  });
  return getExpenseReductionSuggestionFromSummary(summary);
}

export async function getDashboardMultiMonthSummary(
  userId: string,
  endYearMonth: string,
  months = 6
): Promise<MultiMonthItem[]> {
  const yearMonths = buildYearMonths(endYearMonth, months);
  if (yearMonths.length === 0) return [];

  const rangeStart = parse(`${yearMonths[0]}-01`, "yyyy-MM-dd", new Date());
  const rangeEnd = endOfMonth(parse(`${endYearMonth}-01`, "yyyy-MM-dd", new Date()));
  const { expenses, incomes } = await getDashboardWindowData(userId, rangeStart, rangeEnd);

  const expenseTotalsByYearMonth = new Map<string, number>();
  const incomeTotalsByYearMonth = new Map<string, number>();
  const yearMonthSet = new Set(yearMonths);

  for (const expense of expenses) {
    const yearMonth = resolveExpenseYearMonth(expense);
    if (!yearMonthSet.has(yearMonth)) continue;
    expenseTotalsByYearMonth.set(
      yearMonth,
      (expenseTotalsByYearMonth.get(yearMonth) ?? 0) + expense.amount
    );
  }

  for (const income of incomes) {
    const yearMonth = format(income.date, "yyyy-MM");
    if (!yearMonthSet.has(yearMonth)) continue;
    incomeTotalsByYearMonth.set(
      yearMonth,
      (incomeTotalsByYearMonth.get(yearMonth) ?? 0) + income.amount
    );
  }

  return yearMonths.map((yearMonth) => {
    const income = incomeTotalsByYearMonth.get(yearMonth) ?? 0;
    const expense = expenseTotalsByYearMonth.get(yearMonth) ?? 0;
    return {
      yearMonth,
      label: formatDashboardMonthAbbrev(yearMonth),
      income,
      expense,
      balance: income - expense
    };
  });
}

export async function getDashboardBundle(
  userId: string,
  endYearMonth: string,
  options?: {
    referenceDate?: Date;
    isCurrentCalendarMonth?: boolean;
    months?: number;
  }
): Promise<DashboardBundle> {
  const months = options?.months ?? 6;
  const yearMonths = buildYearMonths(endYearMonth, months);

  const prevYearMonth = previousCompetenceMonth(endYearMonth);
  const firstRangeYearMonth =
    yearMonths.length > 0 && yearMonths[0] < prevYearMonth
      ? yearMonths[0]
      : prevYearMonth;

  const rangeStart = parse(`${firstRangeYearMonth}-01`, "yyyy-MM-dd", new Date());
  const rangeEnd = endOfMonth(parse(`${endYearMonth}-01`, "yyyy-MM-dd", new Date()));
  const { expenses, incomes } = await getDashboardWindowData(userId, rangeStart, rangeEnd);
  const { expensesByYearMonth, incomesByYearMonth } = groupRowsByYearMonth(
    expenses,
    incomes
  );

  const selectedReferenceDate =
    options?.referenceDate ?? parse(`${endYearMonth}-01`, "yyyy-MM-dd", new Date());
  const summary = buildSummaryFromRows(
    selectedReferenceDate,
    expensesByYearMonth.get(endYearMonth) ?? [],
    incomesByYearMonth.get(endYearMonth) ?? [],
    {
      fixedListMode: options?.isCurrentCalendarMonth ? "next7Days" : "fullMonth"
    }
  );

  const prevReferenceDate = parse(
    `${prevYearMonth}-01`,
    "yyyy-MM-dd",
    new Date()
  );
  const prevSummary = buildSummaryFromRows(
    prevReferenceDate,
    expensesByYearMonth.get(prevYearMonth) ?? [],
    incomesByYearMonth.get(prevYearMonth) ?? [],
    {
      fixedListMode: "fullMonth"
    }
  );

  const multiMonthItems = yearMonths.map((yearMonth) => {
    const monthExpenses = expensesByYearMonth.get(yearMonth) ?? [];
    const monthIncomes = incomesByYearMonth.get(yearMonth) ?? [];

    const expense = monthExpenses.reduce((acc, row) => acc + row.amount, 0);
    const income = monthIncomes.reduce((acc, row) => acc + row.amount, 0);

    return {
      yearMonth,
      label: formatDashboardMonthAbbrev(yearMonth),
      income,
      expense,
      balance: income - expense
    };
  });

  return {
    summary,
    prevSummary,
    multiMonthItems,
    suggestion: getExpenseReductionSuggestionFromSummary(summary)
  };
}
