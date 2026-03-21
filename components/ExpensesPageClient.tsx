"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  ExpenseFormFields,
  categoryLabelByValue,
  expenseRecordToFormValues,
  parseCurrencyInput,
  type ExpenseFormValues
} from "@/components/ExpenseFormFields";

type Expense = {
  id: string;
  amount: string;
  category: string;
  description: string | null;
  date: string;
  isFixed: boolean;
  dueDay: number | null;
  competenceMonth: string;
};

function emptyFormDefaults(): ExpenseFormValues {
  const today = new Date();
  return {
    amount: "",
    category: "",
    description: "",
    date: today.toISOString().slice(0, 10),
    isFixed: false,
    dueDay: ""
  };
}

function buildExpensePayload(form: ExpenseFormValues) {
  const parsedAmount = parseCurrencyInput(form.amount);
  return {
    parsedAmount,
    payload: {
      amount: parsedAmount,
      category: form.category,
      description: form.description.trim() || undefined,
      date: form.date,
      isFixed: form.isFixed,
      dueDay: form.isFixed && form.dueDay ? Number(form.dueDay) : null
    }
  };
}

type ExpenseActionsMenu =
  | { id: string; source: "card" | "table" }
  | null;

function expenseMenuButtonRefKey(source: "card" | "table", id: string) {
  return `${source}:${id}`;
}

export function ExpensesPageClient() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ExpenseFormValues>(() =>
    emptyFormDefaults()
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExpenseFormValues>(() =>
    emptyFormDefaults()
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [expenseActionsMenu, setExpenseActionsMenu] =
    useState<ExpenseActionsMenu>(null);
  const [expenseActionsMenuPos, setExpenseActionsMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const expenseMenuButtonRefs = useRef<Map<string, HTMLButtonElement>>(
    new Map()
  );
  const expenseMenuPanelRef = useRef<HTMLDivElement>(null);

  const titleId = "edit-expense-dialog-title";
  const deleteDialogTitleId = "delete-expense-dialog-title";

  const closeEdit = useCallback(() => {
    setEditingId(null);
    setEditError(null);
    setEditSaving(false);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    if (deleteSaving) return;
    setDeleteConfirmId(null);
  }, [deleteSaving]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar despesas.");
        return;
      }
      setItems(
        data.expenses.map((e: Expense & { amount: unknown }) => ({
          ...e,
          amount: e.amount.toString(),
          date: e.date
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao carregar despesas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!editingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEdit();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [editingId, closeEdit]);

  useEffect(() => {
    if (!deleteConfirmId || editingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeleteConfirm();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [deleteConfirmId, editingId, closeDeleteConfirm]);

  useEffect(() => {
    if (!editingId) return;
    requestAnimationFrame(() => {
      document.getElementById("edit-amount")?.focus();
    });
  }, [editingId]);

  useLayoutEffect(() => {
    if (!expenseActionsMenu) {
      setExpenseActionsMenuPos(null);
      return;
    }
    const btn = expenseMenuButtonRefs.current.get(
      expenseMenuButtonRefKey(expenseActionsMenu.source, expenseActionsMenu.id)
    );
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuWidth = 160;
    const margin = 8;
    const left = Math.min(
      Math.max(r.right - menuWidth, margin),
      window.innerWidth - menuWidth - margin
    );
    setExpenseActionsMenuPos({ top: r.bottom + 6, left });
  }, [expenseActionsMenu]);

  useEffect(() => {
    if (!expenseActionsMenu) return;
    const closeMenu = () => setExpenseActionsMenu(null);
    const onScroll = () => closeMenu();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [expenseActionsMenu]);

  useEffect(() => {
    if (!expenseActionsMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const btn = expenseMenuButtonRefs.current.get(
        expenseMenuButtonRefKey(
          expenseActionsMenu.source,
          expenseActionsMenu.id
        )
      );
      const panel = expenseMenuPanelRef.current;
      if (btn?.contains(target) || panel?.contains(target)) return;
      setExpenseActionsMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expenseActionsMenu]);

  useEffect(() => {
    if (!expenseActionsMenu || editingId || deleteConfirmId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpenseActionsMenu(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expenseActionsMenu, editingId, deleteConfirmId]);

  function openEdit(item: Expense) {
    setExpenseActionsMenu(null);
    setEditForm(expenseRecordToFormValues(item));
    setEditError(null);
    setEditingId(item.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { parsedAmount, payload } = buildExpensePayload(form);
    if (!parsedAmount) {
      setError("Informe um valor válido.");
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar despesa.");
        return;
      }
      await loadData();
      setForm((prev) => ({
        ...prev,
        amount: "",
        description: "",
        category: ""
      }));
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao criar despesa.");
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);

    const { parsedAmount, payload } = buildExpensePayload(editForm);
    if (!parsedAmount) {
      setEditError("Informe um valor válido.");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/expenses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Erro ao atualizar despesa.");
        return;
      }
      await loadData();
      closeEdit();
    } catch (err) {
      console.error(err);
      setEditError("Erro inesperado ao atualizar despesa.");
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDeleteExpense() {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao excluir despesa.");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao excluir despesa.");
    } finally {
      setDeleteSaving(false);
    }
  }

  const pendingDeleteExpense = deleteConfirmId
    ? items.find((i) => i.id === deleteConfirmId)
    : undefined;

  return (
    <div className="space-y-6">
      <section className="card p-4">
        <h1 className="text-lg font-semibold">Despesas</h1>
        <p className="mt-1 text-sm text-slate-400">
          Registre rapidamente suas despesas, incluindo fixas.
        </p>

        <form
          className="mt-4 grid gap-3 md:grid-cols-12 md:items-end"
          onSubmit={handleSubmit}
        >
          <ExpenseFormFields idPrefix="create" form={form} setForm={setForm} />

          <button
            type="submit"
            className="btn-primary md:col-span-12 md:w-auto"
          >
            Adicionar despesa
          </button>
        </form>

        {error && <p className="mt-2 error-text">{error}</p>}
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Lista de despesas
        </h2>

        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            Nenhuma despesa cadastrada.
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-2 md:hidden">
              {items.map((item) => {
                const menuOpen =
                  expenseActionsMenu?.id === item.id &&
                  expenseActionsMenu.source === "card";
                const menuDomId = `expense-row-menu-${item.id}`;
                const categoryLabel =
                  categoryLabelByValue[item.category] ?? item.category;
                const description = item.description?.trim() ?? "";
                return (
                  <article
                    key={item.id}
                    className="rounded-md border border-slate-800/60 px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] leading-tight text-slate-500">
                          <time dateTime={item.date}>
                            {format(new Date(item.date), "dd/MM/yyyy", {
                              locale: ptBR
                            })}
                          </time>
                          <span className="text-slate-600" aria-hidden>
                            {" "}
                            ·{" "}
                          </span>
                          <span className="font-medium text-slate-200">
                            {categoryLabel}
                          </span>
                        </p>
                        {description ? (
                          <p className="mt-1 text-xs leading-snug break-words text-slate-400">
                            {description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <p className="text-right text-xs font-semibold tabular-nums text-rose-300">
                          {Number(item.amount).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </p>
                        <button
                          type="button"
                          ref={(el) => {
                            const k = expenseMenuButtonRefKey("card", item.id);
                            if (el) expenseMenuButtonRefs.current.set(k, el);
                            else expenseMenuButtonRefs.current.delete(k);
                          }}
                          id={`expense-row-menu-trigger-card-${item.id}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                          aria-expanded={menuOpen}
                          aria-haspopup="menu"
                          aria-controls={menuDomId}
                          aria-label={`Mais opções — ${categoryLabel}`}
                          onClick={() =>
                            setExpenseActionsMenu((m) =>
                              m?.id === item.id && m.source === "card"
                                ? null
                                : { id: item.id, source: "card" }
                            )
                          }
                        >
                          <span
                            aria-hidden
                            className="text-sm font-semibold leading-none tracking-tight text-slate-400"
                          >
                            ...
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-3 hidden min-w-0 overflow-x-auto md:block">
              <table className="w-full min-w-0 table-fixed text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
                    <th className="w-[5.25rem] py-1.5 pr-2 text-left sm:w-24">
                      Data
                    </th>
                    <th className="w-[28%] max-w-[9rem] py-1.5 pr-2 text-left sm:w-32 sm:max-w-none">
                      Categoria
                    </th>
                    <th className="py-1.5 pr-2 text-left">Descrição</th>
                    <th className="w-[4.5rem] py-1.5 pl-2 text-right sm:w-28">
                      Valor
                    </th>
                    <th className="w-10 py-1.5 pl-1 text-right sm:w-11">
                      <span className="sr-only">Opções</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const menuOpen =
                      expenseActionsMenu?.id === item.id &&
                      expenseActionsMenu.source === "table";
                    const menuDomId = `expense-row-menu-${item.id}`;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-900 last:border-0"
                      >
                        <td className="whitespace-nowrap py-1.5 pr-2 align-top text-slate-500">
                          {format(new Date(item.date), "dd/MM/yyyy", {
                            locale: ptBR
                          })}
                        </td>
                        <td className="break-words py-1.5 pr-2 align-top text-slate-200">
                          {categoryLabelByValue[item.category] ?? item.category}
                        </td>
                        <td className="min-w-0 break-words py-1.5 pr-2 align-top leading-snug text-slate-400">
                          {item.description || "—"}
                        </td>
                        <td className="whitespace-nowrap py-1.5 pl-2 text-right align-top font-medium tabular-nums text-rose-300">
                          {Number(item.amount).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </td>
                        <td className="py-1.5 pl-1 text-right align-top">
                          <button
                            type="button"
                            ref={(el) => {
                              const k = expenseMenuButtonRefKey(
                                "table",
                                item.id
                              );
                              if (el) expenseMenuButtonRefs.current.set(k, el);
                              else expenseMenuButtonRefs.current.delete(k);
                            }}
                            id={`expense-row-menu-trigger-table-${item.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            aria-expanded={menuOpen}
                            aria-haspopup="menu"
                            aria-controls={menuDomId}
                            aria-label={`Mais opções — ${categoryLabelByValue[item.category] ?? item.category}`}
                            onClick={() =>
                              setExpenseActionsMenu((m) =>
                                m?.id === item.id && m.source === "table"
                                  ? null
                                  : { id: item.id, source: "table" }
                              )
                            }
                          >
                            <span
                              aria-hidden
                              className="text-sm font-semibold leading-none tracking-tight text-slate-400"
                            >
                              ...
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {expenseActionsMenu && expenseActionsMenuPos && (
        <div
          ref={expenseMenuPanelRef}
          id={`expense-row-menu-${expenseActionsMenu.id}`}
          role="menu"
          aria-labelledby={`expense-row-menu-trigger-${expenseActionsMenu.source}-${expenseActionsMenu.id}`}
          className="fixed z-[55] min-w-[10rem] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl ring-1 ring-slate-800/80"
          style={{
            top: expenseActionsMenuPos.top,
            left: expenseActionsMenuPos.left
          }}
        >
          {(() => {
            const row = items.find((i) => i.id === expenseActionsMenu.id);
            if (!row) return null;
            return (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800 focus-visible:bg-slate-800 focus-visible:outline-none"
                  onClick={() => openEdit(row)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-950/40 focus-visible:bg-rose-950/40 focus-visible:outline-none"
                  onClick={() => {
                    setExpenseActionsMenu(null);
                    setDeleteConfirmId(row.id);
                  }}
                >
                  Excluir
                </button>
              </>
            );
          })()}
        </div>
      )}

      {editingId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/90 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl ring-1 ring-slate-800/80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id={titleId}
                className="text-base font-semibold text-slate-100"
              >
                Editar despesa
              </h2>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                aria-label="Fechar"
                onClick={closeEdit}
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

            <form
              className="grid gap-3 md:grid-cols-12 md:items-end"
              onSubmit={handleEditSubmit}
            >
              <ExpenseFormFields
                idPrefix="edit"
                form={editForm}
                setForm={setEditForm}
              />

              {editError && (
                <p className="error-text md:col-span-12">{editError}</p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end md:col-span-12">
                <button
                  type="button"
                  className="btn-outline w-full sm:w-auto"
                  onClick={closeEdit}
                  disabled={editSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:w-auto"
                  disabled={editSaving}
                >
                  {editSaving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && !editingId && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/90 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleteSaving) {
              closeDeleteConfirm();
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={deleteDialogTitleId}
            aria-describedby="delete-expense-dialog-desc"
            className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl ring-1 ring-slate-800/80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              id={deleteDialogTitleId}
              className="text-base font-semibold text-slate-100"
            >
              Excluir despesa?
            </h2>
            <p
              id="delete-expense-dialog-desc"
              className="mt-2 text-sm leading-relaxed text-slate-400"
            >
              {pendingDeleteExpense ? (
                <>
                  <span className="text-slate-200">
                    {format(new Date(pendingDeleteExpense.date), "dd/MM/yyyy", {
                      locale: ptBR
                    })}{" "}
                    ·{" "}
                    {categoryLabelByValue[pendingDeleteExpense.category] ??
                      pendingDeleteExpense.category}
                    {pendingDeleteExpense.description
                      ? ` · ${pendingDeleteExpense.description}`
                      : ""}
                  </span>
                  <br />
                </>
              ) : null}
              Esta ação não pode ser desfeita. Deseja excluir permanentemente?
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
                className="w-full rounded-lg border border-rose-600/70 bg-transparent px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-950/40 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={deleteSaving}
                onClick={confirmDeleteExpense}
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
