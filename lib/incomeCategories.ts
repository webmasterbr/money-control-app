import type { LucideIcon } from "lucide-react";
import {
  Award,
  Building2,
  Coins,
  Laptop,
  Package,
  TrendingUp,
  Wallet
} from "lucide-react";

import { CATEGORY_ICON_CLASS } from "@/lib/categoryIconClass";

export { CATEGORY_ICON_CLASS as INCOME_CATEGORY_ICON_CLASS };

export const INCOME_CATEGORY_IDS = [
  "SALARY",
  "FREELANCE",
  "BUSINESS",
  "INVESTMENTS",
  "CASHBACK",
  "BENEFITS_EXTRAS",
  "OTHER"
] as const;

export type IncomeCategoryId = (typeof INCOME_CATEGORY_IDS)[number];

export type IncomeCategory = {
  id: IncomeCategoryId;
  label: string;
  icon: LucideIcon;
  order: number;
};

const incomeCategoryRecords: IncomeCategory[] = [
  { id: "SALARY", label: "Salário", icon: Wallet, order: 1 },
  { id: "FREELANCE", label: "Freelance", icon: Laptop, order: 2 },
  { id: "BUSINESS", label: "Negócio", icon: Building2, order: 3 },
  { id: "INVESTMENTS", label: "Investimentos", icon: TrendingUp, order: 4 },
  { id: "CASHBACK", label: "Cashback", icon: Coins, order: 5 },
  {
    id: "BENEFITS_EXTRAS",
    label: "Benefícios / Extras",
    icon: Award,
    order: 6
  },
  { id: "OTHER", label: "Outros", icon: Package, order: 7 }
];

export const incomeCategories = [...incomeCategoryRecords].sort(
  (a, b) => a.order - b.order
);

const categoryById = new Map<IncomeCategoryId, IncomeCategory>(
  incomeCategories.map((c) => [c.id, c])
);

const otherCategory = categoryById.get("OTHER")!;

export function getIncomeCategoryById(id: string): IncomeCategory | undefined {
  return categoryById.get(id as IncomeCategoryId);
}

export function getIncomeCategoryLabel(id: string): string {
  return getIncomeCategoryById(id)?.label ?? id;
}

export function getIncomeCategoryDisplay(id: string): {
  icon: LucideIcon;
  label: string;
} {
  const found = getIncomeCategoryById(id);
  if (found) return { icon: found.icon, label: found.label };
  return { icon: otherCategory.icon, label: id };
}
