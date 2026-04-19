import type { ExpenseReductionSuggestion } from "@/services/dashboardService";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

type Props = {
  suggestion: ExpenseReductionSuggestion | null;
  isPremiumLocked?: boolean;
};

export function DashboardExpenseReductionSuggestion({
  suggestion,
  isPremiumLocked = false
}: Props) {
  if (isPremiumLocked) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0B1220]">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Sugestão de economia 🔒
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Identifique sua maior oportunidade de economia no mês.
        </p>
        <p className="mt-3 text-xs font-medium text-primary-600 dark:text-primary-400">
          Conhecer Premium
        </p>
      </div>
    );
  }

  if (!suggestion) {
    return null;
  }

  const currentPercent = Math.round(suggestion.currentPercentOfIncome);
  const recommendedPercent = Math.round(suggestion.recommendedPercentOfIncome);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0B1220]">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        💡 Sugestão de economia
      </h2>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        Você gastou {currentPercent}% da sua receita com {suggestion.categoryLabel} neste
        mês.
      </p>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Faixa recomendada: até {recommendedPercent}%.
      </p>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Economia potencial</p>
      <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
        {currencyFormatter.format(suggestion.potentialSaving)}
      </p>
    </div>
  );
}
