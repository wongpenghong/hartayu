import { describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  normalizeTheme,
  readStoredTheme,
  writeStoredTheme,
} from "@/theme/theme";

describe("normalizeTheme", () => {
  it("defaults to light for missing or unknown values", () => {
    expect(normalizeTheme(null)).toBe("light");
    expect(normalizeTheme(undefined)).toBe("light");
    expect(normalizeTheme("system")).toBe("light");
  });

  it("accepts dark", () => {
    expect(normalizeTheme("dark")).toBe("dark");
  });
});

describe("readStoredTheme", () => {
  it("reads persisted preference", () => {
    const storage = { getItem: vi.fn(() => "dark") };
    expect(readStoredTheme(storage)).toBe("dark");
    expect(storage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
  });
});

describe("writeStoredTheme", () => {
  it("persists preference", () => {
    const storage = { setItem: vi.fn() };
    writeStoredTheme("dark", storage);
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "dark");
  });
});

describe("applyThemeToDocument", () => {
  it("toggles dark class on root", () => {
    const root = {
      classList: {
        contains: vi.fn(() => false),
        toggle: vi.fn(),
      },
    } as unknown as HTMLElement;

    applyThemeToDocument("dark", root);
    expect(root.classList.toggle).toHaveBeenCalledWith("dark", true);
    applyThemeToDocument("light", root);
    expect(root.classList.toggle).toHaveBeenCalledWith("dark", false);
  });
});
