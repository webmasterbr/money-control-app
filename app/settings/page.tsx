import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeSettingsSection } from "@/components/ThemeSettingsSection";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Preferências do aplicativo.
        </p>
      </section>

      <ThemeSettingsSection />

      <p>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Voltar ao dashboard
        </Link>
      </p>
    </div>
  );
}
