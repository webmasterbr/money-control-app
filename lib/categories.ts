import type { LucideIcon } from "lucide-react";
import {
  Car,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Home,
  Package,
  Shirt,
  Sparkles,
  Tv,
  Utensils
} from "lucide-react";

export { CATEGORY_ICON_CLASS as EXPENSE_CATEGORY_ICON_CLASS } from "@/lib/categoryIconClass";

export const EXPENSE_CATEGORY_IDS = [
  "FOOD",
  "HOUSING",
  "TRANSPORT",
  "HEALTH",
  "PERSONAL_CARE",
  "CLOTHING",
  "SUBSCRIPTIONS",
  "LEISURE",
  "GIFTS",
  "DONATIONS",
  "EDUCATION",
  "OTHER"
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORY_IDS)[number];

export type ExpenseCategory = {
  id: ExpenseCategoryId;
  label: string;
  icon: LucideIcon;
  order: number;
};

const expenseCategoryRecords: ExpenseCategory[] = [
  { id: "FOOD", label: "Alimentação", icon: Utensils, order: 1 },
  { id: "HOUSING", label: "Moradia", icon: Home, order: 2 },
  { id: "TRANSPORT", label: "Transporte", icon: Car, order: 3 },
  { id: "HEALTH", label: "Saúde", icon: HeartPulse, order: 4 },
  { id: "PERSONAL_CARE", label: "Cuidados Pessoais", icon: Sparkles, order: 5 },
  { id: "CLOTHING", label: "Vestuário", icon: Shirt, order: 6 },
  { id: "SUBSCRIPTIONS", label: "Assinaturas", icon: Tv, order: 7 },
  { id: "LEISURE", label: "Lazer", icon: Gamepad2, order: 8 },
  { id: "GIFTS", label: "Presentes", icon: Gift, order: 9 },
  { id: "DONATIONS", label: "Doações", icon: HeartHandshake, order: 10 },
  { id: "EDUCATION", label: "Educação", icon: GraduationCap, order: 11 },
  { id: "OTHER", label: "Outros", icon: Package, order: 12 }
];

export const expenseCategories = [...expenseCategoryRecords].sort(
  (a, b) => a.order - b.order
);

const categoryById = new Map<ExpenseCategoryId, ExpenseCategory>(
  expenseCategories.map((c) => [c.id, c])
);

const otherCategory = categoryById.get("OTHER")!;

export function getCategoryById(id: string): ExpenseCategory | undefined {
  return categoryById.get(id as ExpenseCategoryId);
}

export function getExpenseCategoryLabel(id: string): string {
  return getCategoryById(id)?.label ?? id;
}

export function getExpenseCategoryDisplay(id: string): {
  icon: LucideIcon;
  label: string;
} {
  const found = getCategoryById(id);
  if (found) return { icon: found.icon, label: found.label };
  return { icon: otherCategory.icon, label: id };
}
