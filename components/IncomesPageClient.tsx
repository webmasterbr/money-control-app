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
import { IncomeCategorySelect } from "@/components/IncomeCategorySelect";
import { parseApiCalendarDate } from "@/lib/calendarDate";
import { formatCompetenceMonth } from "@/lib/dashboardMonth";
import { getDefaultDateForMonth } from "@/lib/expenseCompetence";
import {
  INCOME_CATEGORY_ICON_CLASS,
  getIncomeCategoryDisplay,
  getIncomeCategoryLabel
} from "@/lib/incomeCategories";

function formatCurrencyInput(rawValue: string) {
  const digitsOnly = rawValue.replace(/\D/g, "");
  if (!digitsOnly) return "";

  const numericValue = Number(digitsOnly) / 100;
  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function parseCurrencyInput(maskedValue: string) {
  const digitsOnly = maskedValue.replace(/\D/g, "");
  if (!digitsOnly) return 0;
  return Number(digitsOnly) / 100;
}

type Income = {
  id: string;
  amount: string;
  category: string;
  description: string | null;
  date: string;
};

type IncomeActionsMenu =
  | { id: string; source: "card" | "table" }
  | null;

function incomeMenuButtonRefKey(source: "card" | "table", id: string) {
  return `${source}:${id}`;
}

function incomeRecordToEditForm(item: Income) {
  const d = parseApiCalendarDate(item.date);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return {
    amount: formatCurrencyInput(
      String(Math.round(Number(item.amount) * 100))
    ),
    category: item.category,
    description: item.description ?? "",
    date: `${yyyy}-${mm}-${dd}`
  };
}

type IncomesPageClientProps = {
  listYearMonth: string;
};

export function IncomesPageClient({ listYearMonth }: IncomesPageClientProps) {
  const [items, setItems] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: getDefaultDateForMonth(listYearMonth)
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: getDefaultDateForMonth(listYearMonth)
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const [createSaving, setCreateSaving] = useState(false);

  const [incomeActionsMenu, setIncomeActionsMenu] =
    useState<IncomeActionsMenu>(null);
  const [incomeActionsMenuPos, setIncomeActionsMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const incomeMenuButtonRefs = useRef<Map<string, HTMLButtonElement>>(
    new Map()
  );
  const incomeMenuPanelRef = useRef<HTMLDivElement>(null);

  const editDialogTitleId = "edit-income-dialog-title";

  const deleteDialogTitleId = "delete-income-dialog-title";

  const closeEdit = useCallback(() => {
    setEditingId(null);
    setEditError(null);
    setEditSaving(false);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    if (deleteSaving) return;
    setDeleteConfirmId(null);
  }, [deleteSaving]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/incomes?month=${encodeURIComponent(listYearMonth)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar receitas.");
        return;
      }
      setItems(
        data.incomes.map((i: any) => ({
          ...i,
          amount: i.amount.toString(),
          date: i.date
        }))
      );
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao carregar receitas.");
    } finally {
      setLoading(false);
    }
  }, [listYearMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      date: getDefaultDateForMonth(listYearMonth)
    }));
  }, [listYearMonth]);

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
    if (!editingId) return;
    requestAnimationFrame(() => {
      document.getElementById("edit-income-amount")?.focus();
    });
  }, [editingId]);

  useLayoutEffect(() => {
    if (!incomeActionsMenu) {
      setIncomeActionsMenuPos(null);
      return;
    }
    const btn = incomeMenuButtonRefs.current.get(
      incomeMenuButtonRefKey(incomeActionsMenu.source, incomeActionsMenu.id)
    );
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuWidth = 160;
    const margin = 8;
    const left = Math.min(
      Math.max(r.right - menuWidth, margin),
      window.innerWidth - menuWidth - margin
    );
    setIncomeActionsMenuPos({ top: r.bottom + 6, left });
  }, [incomeActionsMenu]);

  useEffect(() => {
    if (!incomeActionsMenu) return;
    const closeMenu = () => setIncomeActionsMenu(null);
    const onScroll = () => closeMenu();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [incomeActionsMenu]);

  useEffect(() => {
    if (!incomeActionsMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const btn = incomeMenuButtonRefs.current.get(
        incomeMenuButtonRefKey(incomeActionsMenu.source, incomeActionsMenu.id)
      );
      const panel = incomeMenuPanelRef.current;
      if (btn?.contains(target) || panel?.contains(target)) return;
      setIncomeActionsMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [incomeActionsMenu]);

  useEffect(() => {
    if (!incomeActionsMenu || deleteConfirmId || editingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIncomeActionsMenu(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [incomeActionsMenu, deleteConfirmId, editingId]);

  function openEdit(item: Income) {
    setIncomeActionsMenu(null);
    setEditForm(incomeRecordToEditForm(item));
    setEditError(null);
    setEditingId(item.id);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    const parsedAmount = parseCurrencyInput(editForm.amount);
    if (!parsedAmount) {
      setEditError("Informe um valor válido.");
      return;
    }

    if (!editForm.category.trim()) {
      setEditError("Categoria é obrigatória.");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/incomes/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          category: editForm.category,
          description: editForm.description.trim() || undefined,
          date: editForm.date,
          competenceMonth: listYearMonth
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Erro ao atualizar receita.");
        return;
      }
      await loadData();
      closeEdit();
    } catch (err) {
      console.error(err);
      setEditError("Erro inesperado ao atualizar receita.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseCurrencyInput(form.amount);
    if (!parsedAmount) {
      setError("Informe um valor válido.");
      return;
    }

    if (!form.category.trim()) {
      setError("Categoria é obrigatória.");
      return;
    }

    setCreateSaving(true);
    try {
      const res = await fetch("/api/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parsedAmount,
          competenceMonth: listYearMonth
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar receita.");
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
      setError("Erro inesperado ao criar receita.");
    } finally {
      setCreateSaving(false);
    }
  }

  async function confirmDeleteIncome() {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/incomes/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao excluir receita.");
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao excluir receita.");
    } finally {
      setDeleteSaving(false);
    }
  }

  const pendingDeleteIncome = deleteConfirmId
    ? items.find((i) => i.id === deleteConfirmId)
    : undefined;
  const competenceLabel = formatCompetenceMonth(listYearMonth);

  return (
    <div className="space-y-6">
      <section className="card p-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Receitas
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Receitas — {competenceLabel}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Cadastre rapidamente suas receitas do mês.
        </p>

        <form
          className="mt-4 grid gap-3 md:grid-cols-4 md:items-end"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="label" htmlFor="amount">
              Valor (R$)
            </label>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              className="input mt-1"
              placeholder="R$ 0,00"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  amount: formatCurrencyInput(e.target.value)
                }))
              }
              required
            />
          </div>

          <div>
            <label className="label" id="income-create-category-label" htmlFor="category">
              Categoria
            </label>
            <IncomeCategorySelect
              id="category"
              labelId="income-create-category-label"
              value={form.category}
              onChange={(category) => setForm((f) => ({ ...f, category }))}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="date">
              Data
            </label>
            <input
              id="date"
              type="date"
              className="input mt-1"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="label" htmlFor="description">
              Descrição
            </label>
            <input
              id="description"
              type="text"
              className="input mt-1"
              placeholder="Opcional"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <button
            type="submit"
            className="btn-primary md:col-span-4 md:w-auto"
            disabled={createSaving}
            aria-busy={createSaving}
          >
            {createSaving ? "Adicionando..." : "Adicionar receita"}
          </button>
        </form>

        {error && <p className="mt-2 error-text">{error}</p>}
      </section>

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Lista de receitas
        </h2>

        {loading ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Carregando...
          </p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Nenhuma receita cadastrada.
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-2 md:hidden">
              {items.map((item) => {
                const menuOpen =
                  incomeActionsMenu?.id === item.id &&
                  incomeActionsMenu.source === "card";
                const menuDomId = `income-row-menu-${item.id}`;
                const { icon: CategoryIcon, label: categoryLabel } =
                  getIncomeCategoryDisplay(item.category);
                const description = item.description?.trim() ?? "";
                return (
                  <article
                    key={item.id}
                    className="rounded-md border border-slate-200/90 px-2.5 py-2 dark:border-slate-800/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-500">
                          <time dateTime={item.date}>
                            {format(parseApiCalendarDate(item.date), "dd/MM/yyyy", {
                              locale: ptBR
                            })}
                          </time>
                          <span className="text-slate-400 dark:text-slate-600" aria-hidden>
                            {" "}
                            ·{" "}
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <CategoryIcon
                              className={INCOME_CATEGORY_ICON_CLASS}
                              aria-hidden
                            />
                            {categoryLabel}
                          </span>
                        </p>
                        {description ? (
                          <p className="mt-1 text-xs leading-snug break-words text-slate-600 dark:text-slate-400">
                            {description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <p className="text-right text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                          {Number(item.amount).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </p>
                        <button
                          type="button"
                          ref={(el) => {
                            const k = incomeMenuButtonRefKey("card", item.id);
                            if (el) incomeMenuButtonRefs.current.set(k, el);
                            else incomeMenuButtonRefs.current.delete(k);
                          }}
                          id={`income-row-menu-trigger-card-${item.id}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-950"
                          aria-expanded={menuOpen}
                          aria-haspopup="menu"
                          aria-controls={menuDomId}
                          aria-label={`Mais opções — ${categoryLabel}`}
                          onClick={() =>
                            setIncomeActionsMenu((m) =>
                              m?.id === item.id && m.source === "card"
                                ? null
                                : { id: item.id, source: "card" }
                            )
                          }
                        >
                          <span
                            aria-hidden
                            className="text-sm font-semibold leading-none tracking-tight text-slate-600 dark:text-slate-400"
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
                  <tr className="border-b border-slate-200 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:text-slate-500 sm:text-xs">
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
                      incomeActionsMenu?.id === item.id &&
                      incomeActionsMenu.source === "table";
                    const menuDomId = `income-row-menu-${item.id}`;
                    const { icon: CategoryIcon, label: categoryLabel } =
                      getIncomeCategoryDisplay(item.category);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-900"
                      >
                        <td className="whitespace-nowrap py-1.5 pr-2 align-top text-slate-600 dark:text-slate-500">
                          {format(parseApiCalendarDate(item.date), "dd/MM/yyyy", {
                            locale: ptBR
                          })}
                        </td>
                        <td className="break-words py-1.5 pr-2 align-top text-slate-800 dark:text-slate-200">
                          <span className="flex items-center gap-2">
                            <CategoryIcon
                              className={INCOME_CATEGORY_ICON_CLASS}
                              aria-hidden
                            />
                            <span>{categoryLabel}</span>
                          </span>
                        </td>
                        <td className="min-w-0 break-words py-1.5 pr-2 align-top leading-snug text-slate-600 dark:text-slate-400">
                          {item.description || "—"}
                        </td>
                        <td className="whitespace-nowrap py-1.5 pl-2 text-right align-top font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                          {Number(item.amount).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          })}
                        </td>
                        <td className="py-1.5 pl-1 text-right align-top">
                          <button
                            type="button"
                            ref={(el) => {
                              const k = incomeMenuButtonRefKey(
                                "table",
                                item.id
                              );
                              if (el) incomeMenuButtonRefs.current.set(k, el);
                              else incomeMenuButtonRefs.current.delete(k);
                            }}
                            id={`income-row-menu-trigger-table-${item.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:focus-visible:ring-offset-slate-950"
                            aria-expanded={menuOpen}
                            aria-haspopup="menu"
                            aria-controls={menuDomId}
                            aria-label={`Mais opções — ${getIncomeCategoryLabel(item.category)}`}
                            onClick={() =>
                              setIncomeActionsMenu((m) =>
                                m?.id === item.id && m.source === "table"
                                  ? null
                                  : { id: item.id, source: "table" }
                              )
                            }
                          >
                            <span
                              aria-hidden
                              className="text-sm font-semibold leading-none tracking-tight text-slate-600 dark:text-slate-400"
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

      {incomeActionsMenu && incomeActionsMenuPos && (
        <div
          ref={incomeMenuPanelRef}
          id={`income-row-menu-${incomeActionsMenu.id}`}
          role="menu"
          aria-labelledby={`income-row-menu-trigger-${incomeActionsMenu.source}-${incomeActionsMenu.id}`}
          className="fixed z-[55] min-w-[10rem] rounded-lg border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-slate-200/90 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800/80"
          style={{
            top: incomeActionsMenuPos.top,
            left: incomeActionsMenuPos.left
          }}
        >
          {(() => {
            const row = items.find((i) => i.id === incomeActionsMenu.id);
            if (!row) return null;
            return (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-sm text-slate-800 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800"
                  onClick={() => openEdit(row)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full px-3 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-950/40 focus-visible:bg-rose-950/40 focus-visible:outline-none"
                  onClick={() => {
                    setIncomeActionsMenu(null);
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-slate-950/90 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={editDialogTitleId}
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-slate-200/90 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800/80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id={editDialogTitleId}
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Editar receita
              </h2>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
              <div className="md:col-span-4">
                <label className="label" htmlFor="edit-income-amount">
                  Valor (R$)
                </label>
                <input
                  id="edit-income-amount"
                  type="text"
                  inputMode="decimal"
                  className="input mt-1"
                  placeholder="R$ 0,00"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      amount: formatCurrencyInput(e.target.value)
                    }))
                  }
                  required
                />
              </div>

              <div className="md:col-span-4">
                <label className="label" id="income-edit-category-label" htmlFor="edit-income-category">
                  Categoria
                </label>
                <IncomeCategorySelect
                  id="edit-income-category"
                  labelId="income-edit-category-label"
                  value={editForm.category}
                  onChange={(category) =>
                    setEditForm((f) => ({ ...f, category }))
                  }
                  required
                />
              </div>

              <div className="md:col-span-4">
                <label className="label" htmlFor="edit-income-date">
                  Data
                </label>
                <input
                  id="edit-income-date"
                  type="date"
                  className="input mt-1"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="md:col-span-12">
                <label className="label" htmlFor="edit-income-description">
                  Descrição
                </label>
                <input
                  id="edit-income-description"
                  type="text"
                  className="input mt-1"
                  placeholder="Opcional"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      description: e.target.value
                    }))
                  }
                />
              </div>

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
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-slate-950/90 sm:items-center"
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
            aria-describedby="delete-income-dialog-desc"
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-slate-200/90 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800/80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              id={deleteDialogTitleId}
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Excluir receita?
            </h2>
            <p
              id="delete-income-dialog-desc"
              className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
            >
              {pendingDeleteIncome ? (
                <>
                  <span className="text-slate-800 dark:text-slate-200">
                    {format(parseApiCalendarDate(pendingDeleteIncome.date), "dd/MM/yyyy", {
                      locale: ptBR
                    })}{" "}
                    ·{" "}
                    {getIncomeCategoryLabel(pendingDeleteIncome.category)}
                    {pendingDeleteIncome.description
                      ? ` · ${pendingDeleteIncome.description}`
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
                className="w-full rounded-lg border border-rose-600/70 bg-transparent px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-950/40 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={deleteSaving}
                onClick={confirmDeleteIncome}
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

