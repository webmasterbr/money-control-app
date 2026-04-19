const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

type Props = {
  income: number;
  expense: number;
};

export function DashboardIncomeExpenseChart({ income, expense }: Props) {
  const max = Math.max(income, expense, 1);
  const bothPositive = income > 0 && expense > 0;

  function getWidth(value: number) {
    if (value <= 0) return 0;

    const raw = (value / max) * 100;

    if (!bothPositive) return raw;

    return raw < 2 ? 2 : raw;
  }

  function getPercent(value: number) {
    if (value <= 0) return 0;
    return Math.round((value / max) * 100);
  }

  const incomeWidth = getWidth(income);
  const expenseWidth = getWidth(expense);
  const incomePercent = getPercent(income);
  const expensePercent = getPercent(expense);

  return (
    <section
      className="card p-4"
      aria-labelledby="dashboard-income-expense-chart-title"
    >
      <h2
        id="dashboard-income-expense-chart-title"
        className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200"
      >
        Receita vs despesa
      </h2>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-emerald-400">Receitas</span>
            <span className="tabular-nums">
              <span className="text-emerald-400">{money.format(income)}</span>
              <span className="text-gray-500 dark:text-gray-400"> · {incomePercent}%</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-white/10">
            <div
              className="h-full min-w-0 rounded-full bg-emerald-400 transition-[width] duration-300 ease-out"
              style={{ width: `${incomeWidth}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-rose-400">Despesas</span>
            <span className="tabular-nums">
              <span className="text-rose-400">{money.format(expense)}</span>
              <span className="text-gray-500 dark:text-gray-400"> · {expensePercent}%</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-white/10">
            <div
              className="h-full min-w-0 rounded-full bg-rose-400 transition-[width] duration-300 ease-out"
              style={{ width: `${expenseWidth}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
