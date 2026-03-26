import { isValidCompetenceMonth } from "@/lib/dashboardMonth";
import { z } from "zod";

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(80, "Nome muito longo"),
  lastName: z
    .string()
    .trim()
    .min(1, "Sobrenome é obrigatório")
    .max(80, "Sobrenome muito longo"),
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha muito longa")
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória")
});

export const incomeSchema = z.object({
  amount: z.number().positive("Valor deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  date: z.string().or(z.date()), // será normalizado na API
  competenceMonth: z
    .string()
    .refine(isValidCompetenceMonth, "Mês inválido")
    .optional()
});

export const EXPENSE_FIXED_DUE_DAY_MESSAGE =
  "Informe o dia de vencimento (1 a 31) para despesa fixa.";

/** Objeto base sem refine — Zod v4 não permite `.partial()` em schemas com refinamento. */
const expenseObjectSchema = z.object({
  amount: z.number().positive("Valor deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  date: z.string().or(z.date()),
  competenceMonth: z
    .string()
    .refine(isValidCompetenceMonth, "Mês inválido")
    .optional(),
  isFixed: z.boolean().default(false),
  dueDay: z.number().int().min(1).max(31).optional()
});

export const expenseSchema = expenseObjectSchema.refine(
  (data) =>
    !data.isFixed ||
    (typeof data.dueDay === "number" &&
      Number.isInteger(data.dueDay) &&
      data.dueDay >= 1 &&
      data.dueDay <= 31),
  { message: EXPENSE_FIXED_DUE_DAY_MESSAGE, path: ["dueDay"] }
);

/** PUT parcial: validação de dueDay + isFixed fixa fica no handler da rota. */
export const expensePartialWithoutDueDaySchema = expenseObjectSchema
  .partial()
  .omit({ dueDay: true });

export const importFixedExpensesSchema = z.object({
  month: z.string().refine(isValidCompetenceMonth, "Mês inválido")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;


