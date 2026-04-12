export const THEME_STORAGE_KEY = "click-saldo-theme";

export type Theme = "light" | "dark";

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyThemeClass(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Inline before React hydrates; must match readStoredTheme / applyThemeClass.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY
)};var v=localStorage.getItem(k);var r=document.documentElement;if(v==="light")r.classList.remove("dark");else r.classList.add("dark");}catch(e){try{document.documentElement.classList.add("dark");}catch(_){}}})();`;
