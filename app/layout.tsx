import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
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
        <div
          className={`mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 ${
            user ? "pb-24" : ""
          }`}
        >
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Link href={user ? "/dashboard" : "/"} className="text-lg font-semibold tracking-tight">
              Saldo <span className="text-primary-400">Certo</span>
            </Link>
            {!user ? (
              <nav className="flex items-center gap-3 text-sm text-slate-300">
                <Link href="/login" className="hover:text-primary-300">
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg border border-slate-700 px-3 py-1.5 hover:border-primary-500 hover:text-primary-300"
                >
                  Criar conta
                </Link>
              </nav>
            ) : null}
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-6 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Saldo Certo
          </footer>
          {user ? (
            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
          ) : null}
        </div>
      </body>
    </html>
  );
}


