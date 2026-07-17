import type { EntryKind } from "@/ledger/types";
import type { Category } from "@/household/categories";

export function categoriesForKind(
  categories: Category[],
  kind: EntryKind,
): Category[] {
  return categories.filter((category) => category.kind === kind);
}

export function defaultCategoryId(
  categories: Category[],
  kind: EntryKind,
): string {
  return categories.find((category) => category.kind === kind)?.id ?? "";
}

export function categoryNameById(
  categories: Category[],
): Map<string, string> {
  return new Map(categories.map((category) => [category.id, category.name]));
}
