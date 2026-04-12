import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { BrandLogoLink } from "@/components/BrandLogoLink";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getCurrentUser } from "@/lib/auth";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Click Saldo",
  description:
    "Click Saldo — controle simples e poderoso das suas finanças pessoais."
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeProvider>
          <div
            className={`mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 ${
              user ? "pb-24" : ""
            }`}
          >
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <BrandLogoLink
                href={user ? "/dashboard" : "/"}
                className="inline-flex min-h-[44px] min-w-[44px] items-center py-1.5 pl-1 pr-2 -my-0.5 -ml-1 shrink-0"
              />
              {!user ? (
                <nav className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-300">
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 hover:border-primary-500 hover:text-primary-600 dark:border-slate-700 dark:hover:border-primary-500 dark:hover:text-primary-300"
                  >
                    Criar conta
                  </Link>
                </nav>
              ) : null}
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-6 text-xs text-slate-500 dark:text-slate-500">
              &copy; {new Date().getFullYear()} Click Saldo
            </footer>
            {user ? (
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
            ) : null}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
