import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Money Control App",
  description: "Controle simples e poderoso das suas finanças pessoais."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
          <header className="mb-4 flex items-center justify-between">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
              Money <span className="text-primary-400">Control</span>
            </Link>
            <nav className="flex items-center gap-3 text-sm text-slate-300">
              <Link href="/dashboard" className="hover:text-primary-300">
                Dashboard
              </Link>
              <Link href="/incomes" className="hover:text-primary-300">
                Receitas
              </Link>
              <Link href="/expenses" className="hover:text-primary-300">
                Despesas
              </Link>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-6 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Money Control App
          </footer>
        </div>
      </body>
    </html>
  );
}


