/**
 * Shared helpers for server actions.
 *
 * Centralised to prevent drift between action files.
 */

export type SupportedLocale = "no" | "en";

export function getEncodedErrorMessage(message: string): string {
  return encodeURIComponent(message);
}

export function normalizeAppLocale(
  value: FormDataEntryValue | null,
): SupportedLocale {
  return value === "en" ? "en" : "no";
}

export function getOptionalString(
  value: FormDataEntryValue | null,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateLength(
  value: string | null,
  maxLength: number,
): boolean {
  return !value || value.length <= maxLength;
}

export function normalizeSlug(
  value: FormDataEntryValue | null,
): string | null {
  const rawValue = getOptionalString(value);

  if (!rawValue) {
    return null;
  }

  return rawValue
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
