import type { MultiMonthItem } from "@/services/dashboardService";

type Props = {
  items: MultiMonthItem[];
};

export function DashboardMultiMonthChart({ items }: Props) {
  const max = Math.max(...items.flatMap((item) => [item.income, item.expense]), 1);

  function getHeight(value: number) {
    if (value <= 0) return 0;
    const raw = (value / max) * 100;
    return raw < 4 ? 4 : raw;
  }

  return (
    <section
      className="card p-4 sm:p-5"
      aria-labelledby="dashboard-multi-month-chart-title"
    >
      <h2
        id="dashboard-multi-month-chart-title"
        className="text-sm font-semibold text-slate-800 dark:text-slate-200"
      >
        Relatório multi-mês
      </h2>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Últimos 6 meses</p>

      <div className="flex h-52 items-end gap-2 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.yearMonth}
            className="flex h-full min-w-0 flex-1 flex-col items-center rounded-md bg-slate-100/70 p-2 dark:bg-white/5 sm:p-3"
          >
            <div className="flex h-full items-end gap-1.5">
              <div
                className="w-2 rounded-full bg-emerald-400 transition-[height] duration-300 ease-out sm:w-3"
                style={{ height: `${getHeight(item.income)}%` }}
                aria-label={`Receita de ${item.label}`}
              />
              <div
                className="w-2 rounded-full bg-rose-500 transition-[height] duration-300 ease-out sm:w-3"
                style={{ height: `${getHeight(item.expense)}%` }}
                aria-label={`Despesa de ${item.label}`}
              />
            </div>
            <span className="mt-2 w-full truncate text-center text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
          Receita
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
          Despesa
        </span>
      </div>
    </section>
  );
}
