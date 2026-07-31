export function validateEmoji(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const graphemes = [...trimmed];
  if (graphemes.length > 2) {
    return "Pick one or two emoji characters.";
  }

  if (trimmed.length > 8) {
    return "Emoji is too long.";
  }

  return null;
}

export function normalizeEmoji(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
