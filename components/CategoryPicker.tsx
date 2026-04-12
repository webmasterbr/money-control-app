"use client";

import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type CategoryPickerOption = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type Props = {
  id: string;
  labelId?: string;
  value: string;
  onChange: (id: string) => void;
  options: readonly CategoryPickerOption[];
  knownIds: ReadonlySet<string>;
  resolveDisplay: (id: string) => { icon: LucideIcon; label: string };
  iconClassName: string;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
};

export function CategoryPicker({
  id,
  labelId,
  value,
  onChange,
  options,
  knownIds,
  resolveDisplay,
  iconClassName,
  emptyLabel = "Selecione uma categoria",
  required,
  disabled
}: Props) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const display = value
    ? resolveDisplay(value)
    : { icon: null as null, label: emptyLabel };

  const SelectedIcon = display.icon;
  const unknownSelected = Boolean(value && !knownIds.has(value));

  return (
    <div ref={containerRef} className="relative mt-1">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required}
        className="input flex w-full items-center justify-between gap-2 text-left"
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {SelectedIcon ? (
            <SelectedIcon className={iconClassName} aria-hidden />
          ) : null}
          <span className="min-w-0 truncate">{display.label}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-200/90 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800/80"
        >
          <li role="presentation" className="px-1">
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => {
                onChange("");
                close();
              }}
            >
              <span className="min-w-0 truncate">{emptyLabel}</span>
            </button>
          </li>
          {unknownSelected ? (
            <li role="presentation" className="px-1">
              <button
                type="button"
                role="option"
                aria-selected
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                onClick={() => {
                  onChange(value);
                  close();
                }}
              >
                {SelectedIcon ? (
                  <SelectedIcon className={iconClassName} aria-hidden />
                ) : null}
                <span className="min-w-0 truncate font-medium">{value}</span>
              </button>
            </li>
          ) : null}
          {options.map((cat) => {
            const CatIcon = cat.icon;
            const selected = value === cat.id;
            return (
              <li key={cat.id} role="presentation" className="px-1">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    onChange(cat.id);
                    close();
                  }}
                >
                  <CatIcon className={iconClassName} aria-hidden />
                  <span className="min-w-0 truncate">{cat.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
