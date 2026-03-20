"use client";

import { useCallback, useEffect, useState } from "react";
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
  const monthStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
  return {
    amount: "",
    category: "",
    description: "",
    date: today.toISOString().slice(0, 10),
    isFixed: false,
    dueDay: "",
    competenceMonth: monthStr
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
      competenceMonth: form.competenceMonth,
      dueDay: form.isFixed && form.dueDay ? Number(form.dueDay) : null
    }
  };
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

  const titleId = "edit-expense-dialog-title";

  const closeEdit = useCallback(() => {
    setEditingId(null);
    setEditError(null);
    setEditSaving(false);
  }, []);

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
    if (!editingId) return;
    requestAnimationFrame(() => {
      document.getElementById("edit-amount")?.focus();
    });
  }, [editingId]);

  function openEdit(item: Expense) {
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

  async function handleDelete(id: string) {
    if (!confirm("Deseja realmente excluir esta despesa?")) return;
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
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao excluir despesa.");
    }
  }

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
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                  <th className="py-2 text-left">Data</th>
                  <th className="py-2 text-left">Categoria</th>
                  <th className="py-2 text-left">Descrição</th>
                  <th className="py-2 text-left">Tipo</th>
                  <th className="py-2 text-left">Vencimento</th>
                  <th className="py-2 text-left">Competência</th>
                  <th className="py-2 text-right">Valor</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-900 last:border-0"
                  >
                    <td className="py-2 pr-3 text-xs text-slate-400">
                      {format(new Date(item.date), "dd/MM/yyyy", {
                        locale: ptBR
                      })}
                    </td>
                    <td className="py-2 pr-3">
                      {categoryLabelByValue[item.category] ?? item.category}
                    </td>
                    <td className="py-2 pr-3 text-slate-300">
                      {item.description || "-"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-300">
                      {item.isFixed ? "Fixa" : "Variável"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-300">
                      {item.dueDay ?? "-"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-300">
                      {item.competenceMonth}
                    </td>
                    <td className="py-2 pl-3 text-right font-medium text-rose-300">
                      {Number(item.amount).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </td>
                    <td className="py-2 pl-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-xs font-medium text-primary-400 hover:text-primary-300"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
    </div>
  );
}
