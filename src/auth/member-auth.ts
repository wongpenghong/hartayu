export const MEMBER_EMAIL_DOMAIN = "hartayu.internal";

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function memberEmail(username: string): string {
  return `${normalizeUsername(username)}@${MEMBER_EMAIL_DOMAIN}`;
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (!/^[a-z0-9_]{2,20}$/.test(normalized)) {
    return "Username must be 2–20 characters: lowercase letters, numbers, underscore.";
  }
  return null;
}

export function validatePin(pin: string): string | null {
  if (!/^\d{6}$/.test(pin)) {
    return "PIN must be exactly 6 digits.";
  }
  return null;
}

export function usernameFromEmail(email: string | undefined): string | null {
  if (!email) {
    return null;
  }
  const [local, domain] = email.split("@");
  if (domain !== MEMBER_EMAIL_DOMAIN || !local) {
    return null;
  }
  return local;
}

export function formatAuthError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Something went wrong";
}
