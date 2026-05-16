"use client";

import { useMemo } from "react";
import { parseApiCalendarDate } from "@/lib/calendarDate";
import { parseMoneyExpression } from "@/lib/parseMoneyExpression";
import { ExpenseCategorySelect } from "@/components/ExpenseCategorySelect";

function normalizeAmountExpression(value: string) {
  return value
    .replace(/R\$/gi, "")
    .replace(/[^\d.,+\s]/g, "")
    .replace(/\s+/g, " ");
}

export type ExpenseFormValues = {
  amount: string;
  category: string;
  description: string;
  date: string;
  isFixed: boolean;
  dueDay: string;
};

export function formatCurrencyInput(rawValue: string) {
  const digitsOnly = rawValue.replace(/\D/g, "");
  if (!digitsOnly) return "";

  const numericValue = Number(digitsOnly) / 100;
  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function parseCurrencyInput(maskedValue: string) {
  const digitsOnly = maskedValue.replace(/\D/g, "");
  if (!digitsOnly) return 0;
  return Number(digitsOnly) / 100;
}

export function amountToCurrencyMask(amount: number | string) {
  const cents = Math.round(Number(amount) * 100);
  return formatCurrencyInput(String(cents));
}

export function expenseRecordToFormValues(expense: {
  amount: string | number;
  category: string;
  description: string | null;
  date: string;
  isFixed: boolean;
  dueDay: number | null;
}): ExpenseFormValues {
  const d = parseApiCalendarDate(expense.date);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return {
    amount: amountToCurrencyMask(expense.amount),
    category: expense.category,
    description: expense.description ?? "",
    date: `${yyyy}-${mm}-${dd}`,
    isFixed: expense.isFixed,
    dueDay: expense.dueDay != null ? String(expense.dueDay) : ""
  };
}

type Props = {
  idPrefix: string;
  form: ExpenseFormValues;
  setForm: React.Dispatch<React.SetStateAction<ExpenseFormValues>>;
};

export function ExpenseFormFields({ idPrefix, form, setForm }: Props) {
  const pid = (name: string) => `${idPrefix}-${name}`;
  const categoryLabelId = `${idPrefix}-category-label`;

  const amountHasExpression = form.amount.includes("+");
  const amountExpressionFeedback = useMemo(() => {
    if (!amountHasExpression) return null;
    return parseMoneyExpression(form.amount);
  }, [amountHasExpression, form.amount]);

  return (
    <>
      <div className="md:col-span-2">
        <label className="label" htmlFor={pid("amount")}>
          Valor (R$)
        </label>
        <input
          id={pid("amount")}
          type="text"
          inputMode="decimal"
          className="input mt-1"
          placeholder="42,70 ou 12,50 + 8,30"
          value={form.amount}
          onChange={(e) => {
            const v = e.target.value;
            setForm((f) => ({
              ...f,
              amount: v.includes("+")
                ? normalizeAmountExpression(v)
                : formatCurrencyInput(v)
            }));
          }}
          required
        />
        {amountHasExpression && amountExpressionFeedback?.isValid ? (
          <p className="mt-1 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Total: </span>
            <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
              {amountExpressionFeedback.value!.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}
            </span>
          </p>
        ) : null}
        {amountHasExpression &&
        form.amount.trim() &&
        amountExpressionFeedback &&
        !amountExpressionFeedback.isValid ? (
          <p className="mt-1 error-text">Valor inválido</p>
        ) : null}
      </div>

      <div className="md:col-span-4">
        <label className="label" id={categoryLabelId} htmlFor={pid("category")}>
          Categoria
        </label>
        <ExpenseCategorySelect
          id={pid("category")}
          labelId={categoryLabelId}
          value={form.category}
          onChange={(category) => setForm((f) => ({ ...f, category }))}
          required
        />
      </div>

      <div className="md:col-span-6">
        <label className="label" htmlFor={pid("date")}>
          Data
        </label>
        <input
          id={pid("date")}
          type="date"
          className="input mt-1"
          value={form.date}
          onChange={(e) =>
            setForm((f) => ({ ...f, date: e.target.value }))
          }
          required
        />
      </div>

      <div className="md:col-span-12">
        <label
          className="label text-sm font-medium text-slate-900 md:text-base dark:text-slate-100"
          htmlFor={pid("description")}
        >
          Descrição
        </label>
        <input
          id={pid("description")}
          type="text"
          className="input mt-1 md:min-h-[2.75rem] md:text-base"
          placeholder="Ex: Mercado, aluguel, Uber..."
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:gap-4 md:col-span-12">
        <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
          <input
            type="checkbox"
            checked={form.isFixed}
            onChange={(e) =>
              setForm((f) => ({ ...f, isFixed: e.target.checked }))
            }
          />
          Despesa fixa
        </label>

        <div className="min-w-0 flex-1 sm:max-w-[12rem]">
          <label className="label" htmlFor={pid("dueDay")}>
            Dia vencimento
          </label>
          <input
            id={pid("dueDay")}
            type="number"
            min="1"
            max="31"
            className="input mt-1"
            value={form.dueDay}
            onChange={(e) =>
              setForm((f) => ({ ...f, dueDay: e.target.value }))
            }
            disabled={!form.isFixed}
            required={form.isFixed}
            aria-required={form.isFixed}
          />
        </div>
      </div>
    </>
  );
}
