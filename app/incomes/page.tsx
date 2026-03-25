import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { resolveDashboardMonth } from "@/lib/dashboardMonth";
import { IncomesPageClient } from "@/components/IncomesPageClient";

type IncomesPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function IncomesPage({ searchParams }: IncomesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const { yearMonth } = resolveDashboardMonth(sp.month, new Date());

  return <IncomesPageClient listYearMonth={yearMonth} />;
}

