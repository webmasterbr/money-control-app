"use client";

import { CategoryPicker } from "@/components/CategoryPicker";
import {
  EXPENSE_CATEGORY_ICON_CLASS,
  expenseCategories,
  getExpenseCategoryDisplay
} from "@/lib/categories";

const knownIds = new Set<string>(expenseCategories.map((c) => c.id));

type Props = {
  id: string;
  labelId?: string;
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export function ExpenseCategorySelect(props: Props) {
  return (
    <CategoryPicker
      {...props}
      options={expenseCategories}
      knownIds={knownIds}
      resolveDisplay={getExpenseCategoryDisplay}
      iconClassName={EXPENSE_CATEGORY_ICON_CLASS}
    />
  );
}
