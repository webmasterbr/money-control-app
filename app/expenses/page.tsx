import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { resolveDashboardMonth } from "@/lib/dashboardMonth";
import { ExpensesPageClient } from "@/components/ExpensesPageClient";

type ExpensesPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const { yearMonth } = resolveDashboardMonth(sp.month, new Date());

  return <ExpensesPageClient listCompetenceMonth={yearMonth} />;
}

