import type { EntryKind } from "@/ledger/types";
import type { Category } from "@/household/categories";

type CategoryKind = Exclude<EntryKind, "transfer">;

export function categoriesForKind(
  categories: Category[],
  kind: CategoryKind,
): Category[] {
  return categories.filter((category) => category.kind === kind);
}

export function defaultCategoryId(
  categories: Category[],
  kind: CategoryKind,
): string {
  return categories.find((category) => category.kind === kind)?.id ?? "";
}

export function categoryNameById(
  categories: Category[],
): Map<string, string> {
  return new Map(categories.map((category) => [category.id, category.name]));
}

export function categoryEmojiById(
  categories: Category[],
): Map<string, string | null> {
  return new Map(categories.map((category) => [category.id, category.emoji]));
}
