"use client";

import { parseApiCalendarDate } from "@/lib/calendarDate";

export const expenseCategories = [
  { value: "FOOD", label: "Alimentação" },
  { value: "HOUSING", label: "Moradia" },
  { value: "TRANSPORT", label: "Transporte" },
  { value: "HEALTH", label: "Saúde" },
  { value: "LEISURE", label: "Lazer" },
  { value: "GIFTS", label: "Presentes" },
  { value: "DONATIONS", label: "Doações" },
  { value: "EDUCATION", label: "Educação" },
  { value: "OTHER", label: "Outros" }
];

export const categoryLabelByValue = expenseCategories.reduce<
  Record<string, string>
>((acc, category) => {
  acc[category.value] = category.label;
  return acc;
}, {});

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

/** Converte valor numérico (API) para string mascarada do input */
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

      <div className="md:col-span-4">
        <label className="label" htmlFor={pid("category")}>
          Categoria
        </label>
        <select
          id={pid("category")}
          className="input mt-1"
          value={form.category}
          onChange={(e) =>
            setForm((f) => ({ ...f, category: e.target.value }))
          }
          required
        >
          <option value="" disabled>
            Selecione uma categoria
          </option>
          {form.category &&
            !expenseCategories.some((c) => c.value === form.category) && (
              <option value={form.category}>{form.category}</option>
            )}
          {expenseCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
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
