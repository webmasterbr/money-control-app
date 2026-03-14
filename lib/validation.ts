import { z } from "zod";

export const registerSchema = z.object({
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
  date: z.string().or(z.date()) // será normalizado na API
});

export const expenseSchema = z.object({
  amount: z.number().positive("Valor deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  date: z.string().or(z.date()),
  isFixed: z.boolean().default(false),
  dueDay: z.number().int().min(1).max(31).optional(),
  competenceMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato de mês de competência inválido (YYYY-MM)")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;


