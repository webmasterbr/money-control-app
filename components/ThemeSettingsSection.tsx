"use client";

import { useTheme } from "@/components/ThemeProvider";
import type { Theme } from "@/lib/theme";

export function ThemeSettingsSection() {
  const { theme, setTheme } = useTheme();

  function onChange(next: Theme) {
    setTheme(next);
  }

  return (
    <section className="card p-4">
      <h2 className="text-xs font-medium uppercase text-slate-600 dark:text-slate-400">
        Aparência
      </h2>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Tema
        </legend>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === "light"}
              onChange={() => onChange("light")}
              className="h-4 w-4 border-slate-400 text-primary-600 focus:ring-primary-500 dark:border-slate-600"
            />
            Claro
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === "dark"}
              onChange={() => onChange("dark")}
              className="h-4 w-4 border-slate-400 text-primary-600 focus:ring-primary-500 dark:border-slate-600"
            />
            Escuro
          </label>
        </div>
      </fieldset>
    </section>
  );
}
