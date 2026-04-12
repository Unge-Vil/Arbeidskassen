"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canManageTenantAdministration,
  createServerClient,
  getTenantContext,
  type Database,
} from "@arbeidskassen/supabase";

type WorkingHoursValue = Database["public"]["Tables"]["tenants"]["Row"]["working_hours"];

type SupportedLocale = "no" | "en";

function getEncodedErrorMessage(message: string): string {
  return encodeURIComponent(message);
}

function normalizeAppLocale(value: FormDataEntryValue | null): SupportedLocale {
  return value === "en" ? "en" : "no";
}

function getOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateLength(value: string | null, maxLength: number): boolean {
  return !value || value.length <= maxLength;
}

function normalizeTenantLocale(value: FormDataEntryValue | null): SupportedLocale {
  return value === "en" ? "en" : "no";
}

function normalizeTimezone(value: FormDataEntryValue | null): string {
  const timezone = getOptionalString(value);

  if (!timezone) {
    return "Europe/Oslo";
  }

  return timezone;
}

function normalizeMonth(value: FormDataEntryValue | null): number {
  const parsedValue = Number(value);

  if (Number.isInteger(parsedValue) && parsedValue >= 1 && parsedValue <= 12) {
    return parsedValue;
  }

  return 1;
}

function normalizeEmail(value: FormDataEntryValue | null): string | null {
  const email = getOptionalString(value)?.toLowerCase() ?? null;

  if (!email) {
    return null;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "__invalid__";
}

function normalizeUrl(
  value: FormDataEntryValue | null,
  { allowRelative = false }: { allowRelative?: boolean } = {},
): string | null {
  const rawValue = getOptionalString(value);

  if (!rawValue) {
    return null;
  }

  if (allowRelative && rawValue.startsWith("/")) {
    return rawValue;
  }

  const normalizedValue = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const url = new URL(normalizedValue);
    return url.toString();
  } catch {
    return "__invalid__";
  }
}

function normalizeWorkingHours(
  existingValue: WorkingHoursValue,
  summary: string | null,
): WorkingHoursValue {
  const baseValue =
    existingValue && typeof existingValue === "object" && !Array.isArray(existingValue)
      ? { ...(existingValue as Record<string, unknown>) }
      : {};

  if (summary) {
    return {
      ...baseValue,
      summary,
    };
  }

  if ("summary" in baseValue) {
    delete baseValue.summary;
  }

  return baseValue as WorkingHoursValue;
}

export async function updateTenantSettingsAction(formData: FormData) {
  const currentLocale = normalizeAppLocale(formData.get("currentLocale"));
  const tenantLocale = normalizeTenantLocale(formData.get("tenantLocale"));
  const redirectBase = `/${currentLocale}/organisasjon/virksomhet`;

  const context = await getTenantContext();

  if (!context?.user || !context.currentTenant || !context.currentMembership) {
    redirect(
      `${redirectBase}?error=${getEncodedErrorMessage(
        "Fant ingen aktiv organisasjon å oppdatere.",
      )}`,
    );
  }

  if (!canManageTenantAdministration(context)) {
    redirect(
      `${redirectBase}?error=${getEncodedErrorMessage(
        "Du har ikke tilgang til å endre virksomhetsinnstillingene.",
      )}`,
    );
  }

  const legalName = getOptionalString(formData.get("legalName"));
  const displayName = getOptionalString(formData.get("displayName"));
  const organizationNumber = getOptionalString(formData.get("organizationNumber"));
  const phone = getOptionalString(formData.get("phone"));
  const website = normalizeUrl(formData.get("website"));
  const logoUrl = normalizeUrl(formData.get("logoUrl"), { allowRelative: true });
  const billingEmail = normalizeEmail(formData.get("billingEmail"));
  const workingHoursSummary = getOptionalString(formData.get("workingHoursSummary"));

  if (
    !validateLength(legalName, 160) ||
    !validateLength(displayName, 120) ||
    !validateLength(organizationNumber, 32) ||
    !validateLength(phone, 32) ||
    !validateLength(workingHoursSummary, 120)
  ) {
    redirect(
      `${redirectBase}?error=${getEncodedErrorMessage(
        "En eller flere verdier er for lange. Kort ned teksten og prøv igjen.",
      )}`,
    );
  }

  if (website === "__invalid__" || logoUrl === "__invalid__") {
    redirect(
      `${redirectBase}?error=${getEncodedErrorMessage(
        "Nettsted eller logo-URL er ikke gyldig.",
      )}`,
    );
  }

  if (billingEmail === "__invalid__") {
    redirect(
      `${redirectBase}?error=${getEncodedErrorMessage(
        "Faktura-e-posten må være en gyldig e-postadresse.",
      )}`,
    );
  }

  const supabase = await createServerClient();
  let existingWorkingHours: WorkingHoursValue = {};

  const { data: currentTenantRecord, error: tenantLoadError } = await supabase
    .from("tenants")
    .select("working_hours")
    .eq("id", context.currentTenant.id)
    .maybeSingle();

  if (tenantLoadError) {
    console.error("Failed to load existing working hours", tenantLoadError);
  } else if (currentTenantRecord) {
    existingWorkingHours = (currentTenantRecord as { working_hours: WorkingHoursValue }).working_hours;
  }

  const updatePayload = {
    legal_name: legalName,
    display_name: displayName,
    organization_number: organizationNumber,
    phone,
    website,
    billing_email: billingEmail,
    locale: tenantLocale,
    timezone: normalizeTimezone(formData.get("timezone")),
    logo_url: logoUrl,
    fiscal_year_start_month: normalizeMonth(formData.get("fiscalYearStartMonth")),
    working_hours: normalizeWorkingHours(existingWorkingHours, workingHoursSummary),
  } satisfies Database["public"]["Tables"]["tenants"]["Update"];

  const { error: updateError } = await supabase
    .from("tenants")
    .update(updatePayload as never)
    .eq("id", context.currentTenant.id);

  if (updateError) {
    console.error("Failed to update tenant settings", updateError);
    redirect(
      `${redirectBase}?error=${getEncodedErrorMessage(
        updateError.message || "Kunne ikke lagre virksomhetsinfo akkurat nå.",
      )}`,
    );
  }

  const targetLocale = tenantLocale === "en" ? "en" : "no";

  revalidatePath(`/${currentLocale}/organisasjon/virksomhet`);
  revalidatePath(`/${targetLocale}/organisasjon/virksomhet`);
  revalidatePath(`/${currentLocale}`);
  revalidatePath(`/${targetLocale}`);
  revalidatePath("/", "layout");

  redirect(`/${targetLocale}/organisasjon/virksomhet?saved=1`);
}
