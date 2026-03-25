"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { useDashboardMonth } from "@/lib/hooks/useDashboardMonth";

const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/incomes", label: "Receitas", icon: "💰" },
  { href: "/expenses", label: "Despesas", icon: "💸" }
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { hrefWithMonth } = useDashboardMonth();
  const [configOpen, setConfigOpen] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        configRef.current &&
        !configRef.current.contains(e.target as Node)
      ) {
        setConfigOpen(false);
      }
    }
    if (configOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [configOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setConfigOpen(false);
    }
    if (configOpen) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [configOpen]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md"
      aria-label="Navegação principal"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-4 gap-1 px-2 py-2">
        {MAIN_NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={hrefWithMonth(item.href)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-[0.65rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                active
                  ? "text-primary-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="relative flex justify-center" ref={configRef}>
          <button
            type="button"
            className={`flex w-full max-w-[5rem] flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-[0.65rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              pathname.startsWith("/profile") || configOpen
                ? "text-primary-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
            aria-expanded={configOpen}
            aria-haspopup="menu"
            aria-label="Configurações"
            onClick={() => setConfigOpen((o) => !o)}
          >
            <span className="text-lg leading-none" aria-hidden>
              ⚙️
            </span>
            <span>Config</span>
          </button>

          {configOpen ? (
            <div
              role="menu"
              className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-slate-800 bg-slate-900 py-1 shadow-xl ring-1 ring-slate-800/80"
            >
              <Link
                role="menuitem"
                href="/profile"
                className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => setConfigOpen(false)}
              >
                Perfil
              </Link>
              <div className="border-t border-slate-800 px-2 py-1">
                <LogoutButton className="w-full rounded-md px-2 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-slate-800 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
