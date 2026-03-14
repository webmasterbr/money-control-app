import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ExpensesPageClient } from "@/components/ExpensesPageClient";

export default async function ExpensesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <ExpensesPageClient />;
}

