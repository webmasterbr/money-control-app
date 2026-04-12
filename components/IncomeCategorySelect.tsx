"use client";

import { CategoryPicker } from "@/components/CategoryPicker";
import {
  INCOME_CATEGORY_ICON_CLASS,
  getIncomeCategoryDisplay,
  incomeCategories
} from "@/lib/incomeCategories";

const knownIds = new Set<string>(incomeCategories.map((c) => c.id));

type Props = {
  id: string;
  labelId?: string;
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export function IncomeCategorySelect(props: Props) {
  return (
    <CategoryPicker
      {...props}
      options={incomeCategories}
      knownIds={knownIds}
      resolveDisplay={getIncomeCategoryDisplay}
      iconClassName={INCOME_CATEGORY_ICON_CLASS}
    />
  );
}
