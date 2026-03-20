import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saldo Certo",
  description: "Controle simples e poderoso das suas finanças pessoais."
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
              Saldo <span className="text-primary-400">Certo</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300">
              <Link href="/dashboard" className="hover:text-primary-300">
                Dashboard
              </Link>
              <Link href="/incomes" className="hover:text-primary-300">
                Receitas
              </Link>
              <Link href="/expenses" className="hover:text-primary-300">
                Despesas
              </Link>
              {user ? (
                <>
                  <span
                    className="hidden h-4 w-px bg-slate-700 sm:block"
                    aria-hidden
                  />
                  <LogoutButton />
                </>
              ) : null}
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-6 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Saldo Certo
          </footer>
        </div>
      </body>
    </html>
  );
}


