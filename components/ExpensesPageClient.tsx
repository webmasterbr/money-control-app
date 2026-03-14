"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";

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

export function ExpensesPageClient() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const monthStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: today.toISOString().slice(0, 10),
    isFixed: false,
    dueDay: "",
    competenceMonth: monthStr
  });

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
        data.expenses.map((e: any) => ({
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      dueDay: form.dueDay ? Number(form.dueDay) : undefined
    };

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
          className="mt-4 grid gap-3 md:grid-cols-6 md:items-end"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="label" htmlFor="amount">
              Valor (R$)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              className="input mt-1"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="category">
              Categoria
            </label>
            <input
              id="category"
              type="text"
              className="input mt-1"
              placeholder="Aluguel, Mercado..."
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
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

          <div>
            <label className="label" htmlFor="competenceMonth">
              Mês competência
            </label>
            <input
              id="competenceMonth"
              type="month"
              className="input mt-1"
              value={form.competenceMonth}
              onChange={(e) =>
                setForm((f) => ({ ...f, competenceMonth: e.target.value }))
              }
              required
            />
          </div>

          <div className="md:col-span-2">
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

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.isFixed}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isFixed: e.target.checked }))
                }
              />
              Despesa fixa
            </label>

            <div className="flex-1">
              <label className="label" htmlFor="dueDay">
                Dia vencimento
              </label>
              <input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                className="input mt-1"
                value={form.dueDay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDay: e.target.value }))
                }
                disabled={!form.isFixed}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary md:col-span-6 md:w-auto"
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
                  <th className="py-2 text-right"></th>
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
                    <td className="py-2 pr-3">{item.category}</td>
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
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

