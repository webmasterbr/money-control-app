import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { IncomesPageClient } from "@/components/IncomesPageClient";

export default async function IncomesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <IncomesPageClient />;
}

