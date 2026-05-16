"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  formatBRL,
  formatCurrencyInput,
  parseCurrencyInput
} from "@/lib/currency";
import type {
  FinancialGoalMetrics,
  FinancialGoalStatus,
  SerializedFinancialGoal
} from "@/lib/financialGoals";

type GoalsSummary = {
  totalGoals: number;
  mainGoal: SerializedFinancialGoal | null;
  mainGoalMetrics: FinancialGoalMetrics | null;
};

function statusLabel(status: FinancialGoalStatus): string {
  switch (status) {
    case "completed":
      return "Concluída";
    case "overdue":
      return "Atrasada";
    default:
      return "Em andamento";
  }
}

function statusBadgeClass(status: FinancialGoalStatus): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "overdue":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export function DashboardFinancialGoalsCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);

  const [addAmountOpen, setAddAmountOpen] = useState(false);
  const [addAmountValue, setAddAmountValue] = useState("");
  const [addAmountError, setAddAmountError] = useState<string | null>(null);
  const [addAmountSaving, setAddAmountSaving] = useState(false);

  const addAmountDialogTitleId = "dashboard-goal-add-amount-title";

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/goals/summary");
      const data = await res.json();
      if (!res.ok) {
        setError(true);
        setSummary(null);
        return;
      }
      setSummary({
        totalGoals: data.totalGoals ?? 0,
        mainGoal: data.mainGoal ?? null,
        mainGoalMetrics: data.mainGoalMetrics ?? null
      });
    } catch (err) {
      console.error("[DASHBOARD_GOALS_SUMMARY]", err);
      setError(true);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!addAmountOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !addAmountSaving) closeAddAmount();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [addAmountOpen, addAmountSaving]);

  function closeAddAmount() {
    if (addAmountSaving) return;
    setAddAmountOpen(false);
    setAddAmountValue("");
    setAddAmountError(null);
  }

  async function handleAddAmountSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary?.mainGoal) return;
    setAddAmountError(null);

    const amount = parseCurrencyInput(addAmountValue);
    if (amount <= 0) {
      setAddAmountError("Informe um valor maior que zero.");
      return;
    }

    setAddAmountSaving(true);
    try {
      const res = await fetch(
        `/api/goals/${summary.mainGoal.id}/add-amount`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount })
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setAddAmountError(data.error ?? "Erro ao adicionar valor.");
        return;
      }
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              mainGoal: data.goal,
              mainGoalMetrics: data.metrics
            }
          : prev
      );
      closeAddAmount();
    } catch (err) {
      console.error(err);
      setAddAmountError("Erro inesperado ao adicionar valor.");
    } finally {
      setAddAmountSaving(false);
    }
  }

  const hasMainGoal =
    summary?.mainGoal != null && summary.mainGoalMetrics != null;
  const allCompleted =
    !loading &&
    !error &&
    summary != null &&
    summary.totalGoals > 0 &&
    !hasMainGoal;

  return (
  <>
    <section className="card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        🎯 Metas financeiras
      </h2>

      {loading && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Carregando metas...
        </p>
      )}

      {error && !loading && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Não foi possível carregar suas metas agora.
        </p>
      )}

      {!loading && !error && summary && !hasMainGoal && (
        <div className="mt-3">
          {allCompleted ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Todas as suas metas foram concluídas.
            </p>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Crie metas para acompanhar seus objetivos financeiros.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {!allCompleted && (
              <Link href="/goals" className="btn-primary">
                Criar meta
              </Link>
            )}
            {summary.totalGoals > 0 && (
              <Link href="/goals" className="btn-outline">
                Ver todas
              </Link>
            )}
          </div>
        </div>
      )}

      {!loading && !error && hasMainGoal && summary.mainGoal && summary.mainGoalMetrics && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {summary.mainGoal.name}
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {formatBRL(summary.mainGoal.currentAmount)} de{" "}
                {formatBRL(summary.mainGoal.targetAmount)}
              </p>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                {Math.round(summary.mainGoalMetrics.progressPercentCapped)}%
                concluído
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(summary.mainGoalMetrics.status)}`}
            >
              {statusLabel(summary.mainGoalMetrics.status)}
            </span>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            role="progressbar"
            aria-valuenow={Math.round(
              summary.mainGoalMetrics.progressPercentCapped
            )}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso da meta ${summary.mainGoal.name}`}
          >
            <div
              className="h-full rounded-full bg-primary-600 transition-[width] dark:bg-primary-500"
              style={{
                width: `${summary.mainGoalMetrics.progressPercentCapped}%`
              }}
            />
          </div>

          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <p>Faltam {formatBRL(summary.mainGoalMetrics.remainingAmount)}</p>
            {summary.mainGoalMetrics.monthlyNeeded != null && (
              <p>
                Ideal guardar{" "}
                {formatBRL(summary.mainGoalMetrics.monthlyNeeded)}/mês
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setAddAmountOpen(true);
                setAddAmountValue("");
                setAddAmountError(null);
              }}
            >
              + Adicionar valor
            </button>
            <Link href="/goals" className="btn-outline">
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </section>

    {addAmountOpen && summary?.mainGoal && (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-slate-950/90 sm:items-center"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !addAmountSaving) closeAddAmount();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={addAmountDialogTitleId}
          className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-slate-200/90 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800/80"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h2
            id={addAmountDialogTitleId}
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Quanto você guardou para esta meta?
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {summary.mainGoal.name}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Esse valor será somado apenas ao progresso da meta.
          </p>

          <form className="mt-4 grid gap-3" onSubmit={handleAddAmountSubmit}>
            <div>
              <label className="label" htmlFor="dashboard-goal-add-amount">
                Valor (R$)
              </label>
              <input
                id="dashboard-goal-add-amount"
                type="text"
                inputMode="decimal"
                className="input mt-1"
                placeholder="R$ 0,00"
                value={addAmountValue}
                onChange={(e) =>
                  setAddAmountValue(formatCurrencyInput(e.target.value))
                }
                required
                autoFocus
              />
            </div>

            {addAmountError && <p className="error-text">{addAmountError}</p>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-outline w-full sm:w-auto"
                disabled={addAmountSaving}
                onClick={closeAddAmount}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto"
                disabled={addAmountSaving}
                aria-busy={addAmountSaving}
              >
                {addAmountSaving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}
