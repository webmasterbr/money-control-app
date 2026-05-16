import { redirect } from "next/navigation";
import { FinancialGoalsPageClient } from "@/components/FinancialGoalsPageClient";
import { getCurrentUser } from "@/lib/auth";

export default async function GoalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Metas financeiras
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Acompanhe seus objetivos e veja quanto falta para alcançá-los.
        </p>
      </section>

      <FinancialGoalsPageClient />
    </div>
  );
}
