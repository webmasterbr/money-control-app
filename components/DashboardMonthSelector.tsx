"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { addMonths, format, parse } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

type Props = {
  value: string;
};

function capitalizePt(text: string) {
  if (!text) return text;
  return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
}

function parseYearMonth(ym: string) {
  return parse(`${ym}-01`, "yyyy-MM-dd", new Date());
}

export function DashboardMonthSelector({ value }: Props) {
  const router = useRouter();
  const monthInputRef = useRef<HTMLInputElement>(null);
  const anchor = parseYearMonth(value);
  const monthLabel = capitalizePt(
    format(anchor, "MMM yyyy", { locale: ptBR }).replace(/\./g, "")
  );

  const currentYm = format(new Date(), "yyyy-MM");
  const isViewingCurrentMonth = value === currentYm;

  function goToMonth(ym: string) {
    router.replace(`/dashboard?month=${encodeURIComponent(ym)}`);
  }

  function openMonthPicker() {
    const el = monthInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {
      /* showPicker pode falhar se não for gesto do usuário em alguns browsers */
    }
    el.click();
  }

  return (
    <div className="w-full sm:w-auto">
      <div
        className="flex flex-wrap items-center justify-center gap-2 sm:justify-end"
        role="group"
        aria-label="Selecionar mês de referência"
      >
        <button
          type="button"
          className="btn-outline shrink-0 px-2.5 py-2"
          aria-label="Mês anterior"
          onClick={() =>
            goToMonth(format(addMonths(anchor, -1), "yyyy-MM"))
          }
        >
          <span className="sr-only">Mês anterior</span>
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        </button>

        <input
          ref={monthInputRef}
          type="month"
          className="sr-only"
          tabIndex={-1}
          value={value}
          aria-hidden
          onChange={(e) => {
            const next = e.target.value;
            if (next) goToMonth(next);
          }}
        />

        <button
          type="button"
          className="min-w-[6.5rem] rounded-md text-center text-sm font-medium tabular-nums text-slate-900 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-100 dark:hover:text-primary-300 dark:focus-visible:ring-offset-slate-950"
          aria-label={`Abrir seletor de mês. Mês exibido: ${monthLabel}`}
          aria-haspopup="dialog"
          onClick={openMonthPicker}
        >
          {monthLabel}
        </button>

        <button
          type="button"
          className="btn-outline shrink-0 px-2.5 py-2"
          aria-label="Próximo mês"
          onClick={() =>
            goToMonth(format(addMonths(anchor, 1), "yyyy-MM"))
          }
        >
          <span className="sr-only">Próximo mês</span>
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          className={
            isViewingCurrentMonth
              ? "inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm font-medium text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-800 dark:text-slate-500 dark:focus-visible:ring-slate-600 dark:focus-visible:ring-offset-slate-950"
              : "btn-primary shrink-0 px-3 py-2 text-sm"
          }
          aria-label="Ir para o mês atual"
          disabled={isViewingCurrentMonth}
          onClick={() => router.replace("/dashboard")}
        >
          Hoje
        </button>
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
