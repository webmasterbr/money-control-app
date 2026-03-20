import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/services/dashboardService";
import { ExpensesPieChart } from "@/components/ExpensesPieChart";
import { IncomesPieChart } from "@/components/IncomesPieChart";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function userDisplayName(user: CurrentUser) {
  const parts = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return user.email;
}

type FinancialHealth = {
  emoji: string;
  title: string;
  detail: string;
  accentClass: string;
};

function getFinancialHealth(
  incomesTotal: number,
  expensesTotal: number
): FinancialHealth {
  if (incomesTotal <= 0) {
    if (expensesTotal <= 0) {
      return {
        emoji: "⚪",
        title: "Sem base",
        detail:
          "Cadastre receitas no mês para acompanhar o uso em relação à sua renda.",
        accentClass: "text-slate-400"
      };
    }
    return {
      emoji: "🔴",
      title: "Crítico",
      detail:
        "Há despesas no mês, mas nenhuma receita registrada. Revise seu planejamento.",
      accentClass: "text-rose-400"
    };
  }

  const ratioPercent = (expensesTotal / incomesTotal) * 100;

  if (ratioPercent < 50) {
    return {
      emoji: "🟢",
      title: "Saudável",
      detail: `Despesas em relação à receita: ${ratioPercent.toFixed(1)}% (abaixo de 50%).`,
      accentClass: "text-emerald-400"
    };
  }

  if (ratioPercent <= 80) {
    return {
      emoji: "🟡",
      title: "Atenção",
      detail: `Despesas em relação à receita: ${ratioPercent.toFixed(1)}% (entre 50% e 80%).`,
      accentClass: "text-amber-400"
    };
  }

  return {
    emoji: "🔴",
    title: "Crítico",
    detail: `Despesas em relação à receita: ${ratioPercent.toFixed(1)}% (acima de 80%).`,
    accentClass: "text-rose-400"
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const summary = await getDashboardSummary(user.id);
  const health = getFinancialHealth(summary.incomesTotal, summary.expensesTotal);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold tracking-tight">
          Olá,{" "}
          <span className="text-primary-400">{userDisplayName(user)}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Visão geral das suas finanças neste mês.
        </p>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-4">
            <h2 className="text-xs font-medium uppercase text-slate-400">
              Receitas no mês
            </h2>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">
              {formatCurrency(summary.incomesTotal)}
            </p>
          </div>

          <div className="card p-4">
            <h2 className="text-xs font-medium uppercase text-slate-400">
              Despesas no mês
            </h2>
            <p className="mt-2 text-2xl font-semibold text-rose-400">
              {formatCurrency(summary.expensesTotal)}
            </p>
          </div>

          <div className="card p-4">
            <h2 className="text-xs font-medium uppercase text-slate-400">
              Saldo restante
            </h2>
            <p
              className={`mt-2 text-2xl font-semibold ${
                summary.balance >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-xs font-medium uppercase text-slate-400">
            Situação do mês
          </h2>
          <p
            className={`mt-2 flex flex-wrap items-baseline gap-2 text-xl font-semibold ${health.accentClass}`}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {health.emoji}
            </span>
            <span>{health.title}</span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {health.detail}
          </p>
          <p className="mt-3 text-[11px] leading-snug text-slate-500">
            Referência: 🟢 Saudável (&lt; 50%) · 🟡 Atenção (50–80%) · 🔴 Crítico
            (&gt; 80%) da receita em despesas.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-4 md:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-slate-200">
            Despesas fixas
          </h2>
          <p className="text-xs text-slate-400">
            Total de despesas fixas neste mês:
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-100">
            {formatCurrency(summary.fixedExpensesTotal)}
          </p>

          <h3 className="mt-4 text-xs font-medium uppercase text-slate-400">
            Próximas a vencer (7 dias)
          </h3>
          {summary.upcomingFixedExpenses.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Nenhuma despesa fixa próxima do vencimento.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {summary.upcomingFixedExpenses.map((exp) => (
                <li
                  key={exp.id}
                  className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-slate-100">
                      {exp.description || exp.category}
                    </p>
                    <p className="text-xs text-slate-400">
                      Vencimento dia {exp.dueDay} ({exp.competenceMonth})
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-rose-300">
                    {formatCurrency(exp.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <ExpensesPieChart data={summary.expensesByCategory} />
          <IncomesPieChart data={summary.incomesByCategory} />
        </div>
      </section>
    </div>
  );
}

