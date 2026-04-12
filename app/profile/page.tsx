import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

function displayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const parts = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return user.email;
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Perfil
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Dados da sua conta no Click Saldo.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="text-xs font-medium uppercase text-slate-600 dark:text-slate-400">
          Nome
        </h2>
        <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
          {displayName(user)}
        </p>

        <h2 className="mt-4 text-xs font-medium uppercase text-slate-600 dark:text-slate-400">
          E-mail
        </h2>
        <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
          {user.email}
        </p>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Conta criada em{" "}
          {user.createdAt.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          })}
          .
        </p>

        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Voltar ao dashboard
        </Link>
      </section>
    </div>
  );
}
