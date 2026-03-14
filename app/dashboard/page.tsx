import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary } from "@/services/dashboardService";
import { ExpensesPieChart } from "@/components/ExpensesPieChart";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const summary = await getDashboardSummary(user.id);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold tracking-tight">
          Olá, <span className="text-primary-400">{user.email}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Visão geral das suas finanças neste mês.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
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

        <ExpensesPieChart data={summary.expensesByCategory} />
      </section>
    </div>
  );
}

