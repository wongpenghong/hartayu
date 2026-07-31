export const THEME_STORAGE_KEY = "hartayu-theme";

export type ThemePreference = "light" | "dark";

export function normalizeTheme(value: string | null | undefined): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

export function readStoredTheme(
  storage: Pick<Storage, "getItem"> = localStorage,
): ThemePreference {
  return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
}

export function writeStoredTheme(
  theme: ThemePreference,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyThemeToDocument(
  theme: ThemePreference,
  root: HTMLElement = document.documentElement,
): void {
  root.classList.toggle("dark", theme === "dark");
}
