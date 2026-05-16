"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { parseApiCalendarDate } from "@/lib/calendarDate";
import {
  amountToCurrencyMask,
  formatBRL,
  formatCurrencyInput,
  parseCurrencyInput
} from "@/lib/currency";
import type {
  FinancialGoalStatus,
  FinancialGoalWithMetricsResponse
} from "@/lib/financialGoals";

type GoalItem = FinancialGoalWithMetricsResponse;

type FormModalState =
  | null
  | { mode: "create" }
  | { mode: "edit"; item: GoalItem };

type GoalFormState = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  clearDeadline: boolean;
};

const emptyForm = (): GoalFormState => ({
  name: "",
  targetAmount: "",
  currentAmount: "",
  deadline: "",
  clearDeadline: false
});

function sortGoals(items: GoalItem[]): GoalItem[] {
  return [...items].sort((a, b) => {
    const aDeadline = a.goal.deadline
      ? new Date(a.goal.deadline).getTime()
      : null;
    const bDeadline = b.goal.deadline
      ? new Date(b.goal.deadline).getTime()
      : null;

    if (aDeadline !== null && bDeadline !== null) {
      const diff = aDeadline - bDeadline;
      if (diff !== 0) return diff;
    } else if (aDeadline !== null && bDeadline === null) {
      return -1;
    } else if (aDeadline === null && bDeadline !== null) {
      return 1;
    }

    return (
      new Date(a.goal.createdAt).getTime() -
      new Date(b.goal.createdAt).getTime()
    );
  });
}

function deadlineToDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = parseApiCalendarDate(iso);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function goalToForm(item: GoalItem): GoalFormState {
  return {
    name: item.goal.name,
    targetAmount: amountToCurrencyMask(item.goal.targetAmount),
    currentAmount: amountToCurrencyMask(item.goal.currentAmount),
    deadline: deadlineToDateInput(item.goal.deadline),
    clearDeadline: false
  };
}

function formatGoalDeadline(iso: string | null): string | null {
  if (!iso) return null;
  return format(parseApiCalendarDate(iso), "dd/MM/yyyy", { locale: ptBR });
}

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

function replaceGoalInList(
  items: GoalItem[],
  updated: GoalItem
): GoalItem[] {
  return sortGoals(
    items.map((g) => (g.goal.id === updated.goal.id ? updated : g))
  );
}

export function FinancialGoalsPageClient() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [form, setForm] = useState<GoalFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [addAmountGoalId, setAddAmountGoalId] = useState<string | null>(null);
  const [addAmountValue, setAddAmountValue] = useState("");
  const [addAmountError, setAddAmountError] = useState<string | null>(null);
  const [addAmountSaving, setAddAmountSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const formDialogTitleId = "goal-form-dialog-title";
  const addAmountDialogTitleId = "goal-add-amount-dialog-title";
  const deleteDialogTitleId = "goal-delete-dialog-title";

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar metas.");
        return;
      }
      setGoals(sortGoals(data.goals ?? []));
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao carregar metas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    if (!formModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !formSaving) closeFormModal();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [formModal, formSaving]);

  useEffect(() => {
    if (!addAmountGoalId) return;
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
  }, [addAmountGoalId, addAmountSaving]);

  function openCreateModal() {
    setForm(emptyForm());
    setFormError(null);
    setFormModal({ mode: "create" });
  }

  function openEditModal(item: GoalItem) {
    setForm(goalToForm(item));
    setFormError(null);
    setFormModal({ mode: "edit", item });
  }

  function closeFormModal() {
    if (formSaving) return;
    setFormModal(null);
    setFormError(null);
  }

  function openAddAmount(goalId: string) {
    setAddAmountGoalId(goalId);
    setAddAmountValue("");
    setAddAmountError(null);
  }

  function closeAddAmount() {
    if (addAmountSaving) return;
    setAddAmountGoalId(null);
    setAddAmountError(null);
  }

  function closeDeleteConfirm() {
    if (deleteSaving) return;
    setDeleteConfirmId(null);
  }

  function validateForm(): {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: string | null;
  } | null {
    const name = form.name.trim();
    if (!name) {
      setFormError("Nome é obrigatório.");
      return null;
    }

    const targetAmount = parseCurrencyInput(form.targetAmount);
    if (targetAmount <= 0) {
      setFormError("Valor alvo deve ser maior que zero.");
      return null;
    }

    const currentAmountRaw = form.currentAmount.trim();
    let currentAmount: number | undefined;
    if (currentAmountRaw) {
      currentAmount = parseCurrencyInput(form.currentAmount);
      if (currentAmount < 0) {
        setFormError("Valor atual não pode ser negativo.");
        return null;
      }
    }

    let deadline: string | null | undefined;
    if (formModal?.mode === "edit" && form.clearDeadline) {
      deadline = null;
    } else if (form.deadline) {
      deadline = form.deadline;
    } else if (formModal?.mode === "create") {
      deadline = undefined;
    }

    return { name, targetAmount, currentAmount, deadline };
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const payload = validateForm();
    if (!payload) return;

    setFormSaving(true);
    try {
      if (formModal?.mode === "create") {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: payload.name,
            targetAmount: payload.targetAmount,
            currentAmount: payload.currentAmount ?? 0,
            deadline: payload.deadline ?? null
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error ?? "Erro ao criar meta.");
          return;
        }
        setGoals((prev) => sortGoals([...prev, data]));
        closeFormModal();
      } else if (formModal?.mode === "edit") {
        const body: Record<string, unknown> = {
          name: payload.name,
          targetAmount: payload.targetAmount
        };
        if (payload.currentAmount !== undefined) {
          body.currentAmount = payload.currentAmount;
        }
        if (payload.deadline !== undefined) {
          body.deadline = payload.deadline;
        }

        const res = await fetch(`/api/goals/${formModal.item.goal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error ?? "Erro ao atualizar meta.");
          return;
        }
        setGoals((prev) => replaceGoalInList(prev, data));
        closeFormModal();
      }
    } catch (err) {
      console.error(err);
      setFormError("Erro inesperado ao salvar meta.");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleAddAmountSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addAmountGoalId) return;
    setAddAmountError(null);

    const amount = parseCurrencyInput(addAmountValue);
    if (amount <= 0) {
      setAddAmountError("Informe um valor maior que zero.");
      return;
    }

    setAddAmountSaving(true);
    try {
      const res = await fetch(`/api/goals/${addAmountGoalId}/add-amount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!res.ok) {
        setAddAmountError(data.error ?? "Erro ao adicionar valor.");
        return;
      }
      setGoals((prev) => replaceGoalInList(prev, data));
      closeAddAmount();
    } catch (err) {
      console.error(err);
      setAddAmountError("Erro inesperado ao adicionar valor.");
    } finally {
      setAddAmountSaving(false);
    }
  }

  async function confirmDeleteGoal() {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao excluir meta.");
        return;
      }
      setGoals((prev) => prev.filter((g) => g.goal.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao excluir meta.");
    } finally {
      setDeleteSaving(false);
    }
  }

  const pendingDeleteGoal = deleteConfirmId
    ? goals.find((g) => g.goal.id === deleteConfirmId)
    : undefined;

  const addAmountGoal = addAmountGoalId
    ? goals.find((g) => g.goal.id === addAmountGoalId)
    : undefined;

  return (
    <div className="space-y-6">
      {error && !formModal && !addAmountGoalId && (
        <p className="error-text">{error}</p>
      )}

      {loading ? (
        <section className="card p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Carregando...
          </p>
        </section>
      ) : goals.length === 0 ? (
        <section className="card p-6 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Você ainda não tem metas financeiras
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Crie uma meta para acompanhar seus objetivos, como reserva de
            emergência, viagem ou quitar uma dívida.
          </p>
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={openCreateModal}
          >
            Criar meta
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              Nova meta
            </button>
          </div>

          {goals.map((item) => {
            const { goal, metrics } = item;
            const deadlineLabel = formatGoalDeadline(goal.deadline);
            const percent = Math.round(metrics.progressPercentCapped);

            return (
              <article key={goal.id} className="card space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      {goal.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                      {formatBRL(goal.currentAmount)} de{" "}
                      {formatBRL(goal.targetAmount)}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                      {percent}% concluído
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(metrics.status)}`}
                  >
                    {statusLabel(metrics.status)}
                  </span>
                </div>

                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progresso da meta ${goal.name}`}
                >
                  <div
                    className="h-full rounded-full bg-primary-600 transition-[width] dark:bg-primary-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <p>Faltam {formatBRL(metrics.remainingAmount)}</p>
                  {metrics.monthlyNeeded != null && (
                    <p>
                      Ideal guardar {formatBRL(metrics.monthlyNeeded)}/mês
                    </p>
                  )}
                  {deadlineLabel && <p>Prazo: {deadlineLabel}</p>}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => openAddAmount(goal.id)}
                  >
                    + Adicionar valor
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => openEditModal(item)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                    onClick={() => setDeleteConfirmId(goal.id)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {formModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-slate-950/90 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !formSaving) closeFormModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={formDialogTitleId}
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-slate-200/90 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800/80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id={formDialogTitleId}
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {formModal.mode === "create" ? "Nova meta" : "Editar meta"}
              </h2>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Fechar"
                onClick={closeFormModal}
              >
                <span className="sr-only">Fechar</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form className="grid gap-3" onSubmit={handleFormSubmit}>
              <div>
                <label className="label" htmlFor="goal-name">
                  Nome da meta
                </label>
                <input
                  id="goal-name"
                  type="text"
                  className="input mt-1"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="goal-target">
                  Valor alvo
                </label>
                <input
                  id="goal-target"
                  type="text"
                  inputMode="decimal"
                  className="input mt-1"
                  placeholder="R$ 0,00"
                  value={form.targetAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      targetAmount: formatCurrencyInput(e.target.value)
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="goal-current">
                  Valor atual
                </label>
                <input
                  id="goal-current"
                  type="text"
                  inputMode="decimal"
                  className="input mt-1"
                  placeholder="R$ 0,00"
                  value={form.currentAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      currentAmount: formatCurrencyInput(e.target.value)
                    }))
                  }
                />
              </div>

              <div>
                <label className="label" htmlFor="goal-deadline">
                  Prazo (opcional)
                </label>
                <input
                  id="goal-deadline"
                  type="date"
                  className="input mt-1"
                  value={form.deadline}
                  disabled={form.clearDeadline}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      deadline: e.target.value,
                      clearDeadline: false
                    }))
                  }
                />
                {formModal.mode === "edit" && (
                  <label className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={form.clearDeadline}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          clearDeadline: e.target.checked,
                          deadline: e.target.checked ? "" : f.deadline
                        }))
                      }
                    />
                    Remover prazo
                  </label>
                )}
              </div>

              {formError && <p className="error-text">{formError}</p>}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn-outline w-full sm:w-auto"
                  disabled={formSaving}
                  onClick={closeFormModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto"
                  disabled={formSaving}
                  aria-busy={formSaving}
                >
                  {formSaving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addAmountGoalId && (
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
            {addAmountGoal && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {addAmountGoal.goal.name}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Esse valor será somado apenas ao progresso da meta.
            </p>

            <form className="mt-4 grid gap-3" onSubmit={handleAddAmountSubmit}>
              <div>
                <label className="label" htmlFor="goal-add-amount">
                  Valor (R$)
                </label>
                <input
                  id="goal-add-amount"
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

      {deleteConfirmId && !formModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-slate-950/90 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleteSaving) closeDeleteConfirm();
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={deleteDialogTitleId}
            aria-describedby="goal-delete-dialog-desc"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-slate-200/90 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800/80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              id={deleteDialogTitleId}
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Deseja excluir esta meta?
            </h2>
            <p
              id="goal-delete-dialog-desc"
              className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
            >
              {pendingDeleteGoal ? (
                <span className="text-slate-800 dark:text-slate-200">
                  {pendingDeleteGoal.goal.name}
                  <br />
                </span>
              ) : null}
              Ela deixará de aparecer na sua lista.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-outline w-full sm:w-auto"
                disabled={deleteSaving}
                onClick={closeDeleteConfirm}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-rose-600/70 bg-transparent px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-950/40 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={deleteSaving}
                onClick={confirmDeleteGoal}
              >
                {deleteSaving ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
