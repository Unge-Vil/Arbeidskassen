"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canManageTenantAdministration,
  createServerClient,
  getTenantContext,
  type TenantContext,
} from "@arbeidskassen/supabase";

type SupportedLocale = "no" | "en";
type StructureEntityType = "organization" | "department" | "subDepartment";
type StructureAdminContext = TenantContext & {
  currentTenant: NonNullable<TenantContext["currentTenant"]>;
  currentMembership: NonNullable<TenantContext["currentMembership"]>;
};

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

function normalizeSlug(value: FormDataEntryValue | null): string | null {
  const rawValue = getOptionalString(value);

  if (!rawValue) {
    return null;
  }

  return rawValue
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function getStructureRedirectBase(_locale: SupportedLocale): string {
  return `/organisasjon/struktur`;
}

function redirectWithError(locale: SupportedLocale, message: string): never {
  redirect(`${getStructureRedirectBase(locale)}?error=${getEncodedErrorMessage(message)}`);
}

function redirectWithSuccess(locale: SupportedLocale, message: string): never {
  redirect(
    `${getStructureRedirectBase(locale)}?saved=1&message=${getEncodedErrorMessage(message)}`,
  );
}

function revalidateStructurePaths(_locale: SupportedLocale): void {
  revalidatePath(`/organisasjon/struktur`);
  revalidatePath(`/organisasjon/brukere`);
  revalidatePath(`/organisasjon/audit-logg`);
}

async function requireStructureAdmin(locale: SupportedLocale): Promise<StructureAdminContext> {
  const context = await getTenantContext();

  if (!context?.user || !context.currentTenant || !context.currentMembership) {
    redirectWithError(locale, "Fant ingen aktiv organisasjon å oppdatere.");
  }

  if (!canManageTenantAdministration(context)) {
    redirectWithError(locale, "Du har ikke tilgang til å endre organisasjonsstrukturen.");
  }

  return context as StructureAdminContext;
}

export async function createOrganizationAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireStructureAdmin(locale);

  const name = getOptionalString(formData.get("name"));
  const organizationNumber = getOptionalString(formData.get("organizationNumber"));
  const slug = normalizeSlug(formData.get("slug"));

  if (!name) {
    redirectWithError(locale, "Virksomheten må ha et navn.");
  }

  if (!validateLength(name, 120) || !validateLength(organizationNumber, 32)) {
    redirectWithError(locale, "En eller flere verdier er for lange. Kort ned teksten og prøv igjen.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("organizations").insert(
    {
      tenant_id: context.currentTenant.id,
      name,
      organization_number: organizationNumber,
      slug: slug || null,
    } as never,
  );

  if (error) {
    console.error("Failed to create organization", error);

    if (error.code === "23505") {
      redirectWithError(locale, "Sluggen er allerede i bruk i denne workspacen.");
    }

    redirectWithError(locale, "Kunne ikke opprette virksomheten akkurat nå.");
  }

  revalidateStructurePaths(locale);
  redirectWithSuccess(locale, `Virksomheten “${name}” ble opprettet.`);
}

export async function createDepartmentAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireStructureAdmin(locale);

  const orgId = getOptionalString(formData.get("orgId"));
  const name = getOptionalString(formData.get("name"));
  const description = getOptionalString(formData.get("description"));

  if (!orgId || !name) {
    redirectWithError(locale, "Velg en virksomhet og skriv inn navn på avdelingen.");
  }

  if (!validateLength(name, 120) || !validateLength(description, 280)) {
    redirectWithError(locale, "Avdelingsnavnet eller beskrivelsen er for lang.");
  }

  const supabase = await createServerClient();
  const { data: organizationRecord, error: organizationError } = await supabase
    .from("organizations")
    .select("id, is_archived")
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", orgId)
    .maybeSingle();

  const organization = organizationRecord as { id: string; is_archived: boolean } | null;

  if (organizationError || !organization || organization.is_archived) {
    redirectWithError(locale, "Den valgte virksomheten finnes ikke lenger eller er arkivert.");
  }

  const { error } = await supabase.from("departments").insert(
    {
      tenant_id: context.currentTenant.id,
      org_id: orgId,
      name,
      description,
    } as never,
  );

  if (error) {
    console.error("Failed to create department", error);
    redirectWithError(locale, "Kunne ikke opprette avdelingen akkurat nå.");
  }

  revalidateStructurePaths(locale);
  redirectWithSuccess(locale, `Avdelingen “${name}” ble opprettet.`);
}

export async function createSubDepartmentAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireStructureAdmin(locale);

  const deptId = getOptionalString(formData.get("deptId"));
  const name = getOptionalString(formData.get("name"));
  const description = getOptionalString(formData.get("description"));

  if (!deptId || !name) {
    redirectWithError(locale, "Velg en avdeling og skriv inn navn på underavdelingen.");
  }

  if (!validateLength(name, 120) || !validateLength(description, 280)) {
    redirectWithError(locale, "Navnet eller beskrivelsen er for lang.");
  }

  const supabase = await createServerClient();
  const { data: departmentRecord, error: departmentError } = await supabase
    .from("departments")
    .select("id, is_archived")
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", deptId)
    .maybeSingle();

  const department = departmentRecord as { id: string; is_archived: boolean } | null;

  if (departmentError || !department || department.is_archived) {
    redirectWithError(locale, "Den valgte avdelingen finnes ikke lenger eller er arkivert.");
  }

  const { error } = await supabase.from("sub_departments").insert(
    {
      tenant_id: context.currentTenant.id,
      dept_id: deptId,
      name,
      description,
    } as never,
  );

  if (error) {
    console.error("Failed to create sub-department", error);
    redirectWithError(locale, "Kunne ikke opprette underavdelingen akkurat nå.");
  }

  revalidateStructurePaths(locale);
  redirectWithSuccess(locale, `Underavdelingen “${name}” ble opprettet.`);
}

export async function updateOrganizationAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireStructureAdmin(locale);

  const entityId = getOptionalString(formData.get("entityId"));
  const name = getOptionalString(formData.get("name"));
  const organizationNumber = getOptionalString(formData.get("organizationNumber"));
  const slug = normalizeSlug(formData.get("slug"));

  if (!entityId || !name) {
    redirectWithError(locale, "Virksomheten må ha et navn for å kunne lagres.");
  }

  if (!validateLength(name, 120) || !validateLength(organizationNumber, 32)) {
    redirectWithError(locale, "En eller flere verdier er for lange. Kort ned teksten og prøv igjen.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("organizations")
    .update(
      {
        name,
        organization_number: organizationNumber,
        slug: slug || null,
      } as never,
    )
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", entityId);

  if (error) {
    console.error("Failed to update organization", error);

    if (error.code === "23505") {
      redirectWithError(locale, "Sluggen er allerede i bruk i denne workspacen.");
    }

    redirectWithError(locale, "Kunne ikke oppdatere virksomheten akkurat nå.");
  }

  revalidateStructurePaths(locale);
  redirectWithSuccess(locale, `Virksomheten “${name}” ble oppdatert.`);
}

export async function updateDepartmentAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireStructureAdmin(locale);

  const entityId = getOptionalString(formData.get("entityId"));
  const orgId = getOptionalString(formData.get("orgId"));
  const name = getOptionalString(formData.get("name"));
  const description = getOptionalString(formData.get("description"));

  if (!entityId || !orgId || !name) {
    redirectWithError(locale, "Velg virksomhet og skriv inn avdelingsnavn før du lagrer.");
  }

  if (!validateLength(name, 120) || !validateLength(description, 280)) {
    redirectWithError(locale, "Avdelingsnavnet eller beskrivelsen er for lang.");
  }

  const supabase = await createServerClient();
  const { data: organizationRecord, error: organizationError } = await supabase
    .from("organizations")
    .select("id, is_archived")
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", orgId)
    .maybeSingle();

  const organization = organizationRecord as { id: string; is_archived: boolean } | null;

  if (organizationError || !organization || organization.is_archived) {
    redirectWithError(locale, "Du kan bare flytte avdelingen til en aktiv virksomhet.");
  }

  const { error } = await supabase
    .from("departments")
    .update(
      {
        org_id: orgId,
        name,
        description,
      } as never,
    )
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", entityId);

  if (error) {
    console.error("Failed to update department", error);
    redirectWithError(locale, "Kunne ikke oppdatere avdelingen akkurat nå.");
  }

  revalidateStructurePaths(locale);
  redirectWithSuccess(locale, `Avdelingen “${name}” ble oppdatert.`);
}

export async function updateSubDepartmentAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireStructureAdmin(locale);

  const entityId = getOptionalString(formData.get("entityId"));
  const deptId = getOptionalString(formData.get("deptId"));
  const name = getOptionalString(formData.get("name"));
  const description = getOptionalString(formData.get("description"));

  if (!entityId || !deptId || !name) {
    redirectWithError(locale, "Velg avdeling og skriv inn navn på underavdelingen før du lagrer.");
  }

  if (!validateLength(name, 120) || !validateLength(description, 280)) {
    redirectWithError(locale, "Navnet eller beskrivelsen er for lang.");
  }

  const supabase = await createServerClient();
  const { data: departmentRecord, error: departmentError } = await supabase
    .from("departments")
    .select("id, is_archived")
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", deptId)
    .maybeSingle();

  const department = departmentRecord as { id: string; is_archived: boolean } | null;

  if (departmentError || !department || department.is_archived) {
    redirectWithError(locale, "Du kan bare flytte underavdelingen til en aktiv avdeling.");
  }

  const { error } = await supabase
    .from("sub_departments")
    .update(
      {
        dept_id: deptId,
        name,
        description,
      } as never,
    )
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", entityId);

  if (error) {
    console.error("Failed to update sub-department", error);
    redirectWithError(locale, "Kunne ikke oppdatere underavdelingen akkurat nå.");
  }

  revalidateStructurePaths(locale);
  redirectWithSuccess(locale, `Underavdelingen “${name}” ble oppdatert.`);
}

export async function toggleStructureArchiveAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireStructureAdmin(locale);

  const entityId = getOptionalString(formData.get("entityId"));
  const entityType = getOptionalString(formData.get("entityType")) as StructureEntityType | null;
  const nextArchived = formData.get("nextArchived") === "true";

  if (!entityId || !entityType) {
    redirectWithError(locale, "Mangler informasjon om hvilken strukturdel som skal oppdateres.");
  }

  const supabase = await createServerClient();

  if (entityType === "organization") {
    const { error } = await supabase
      .from("organizations")
      .update({ is_archived: nextArchived } as never)
      .eq("tenant_id", context.currentTenant.id)
      .eq("id", entityId);

    if (!error && nextArchived) {
      await supabase
        .from("departments")
        .update({ is_archived: true } as never)
        .eq("tenant_id", context.currentTenant.id)
        .eq("org_id", entityId);

      const { data: childDepartments } = await supabase
        .from("departments")
        .select("id")
        .eq("tenant_id", context.currentTenant.id)
        .eq("org_id", entityId);

      const childDepartmentIds = ((childDepartments ?? []) as Array<{ id: string }>).map(
        (department) => department.id,
      );

      if (childDepartmentIds.length > 0) {
        await supabase
          .from("sub_departments")
          .update({ is_archived: true } as never)
          .eq("tenant_id", context.currentTenant.id)
          .in("dept_id", childDepartmentIds);
      }
    }

    if (error) {
      console.error("Failed to update organization archive state", error);
      redirectWithError(locale, "Kunne ikke oppdatere virksomheten akkurat nå.");
    }
  } else if (entityType === "department") {
    const { error } = await supabase
      .from("departments")
      .update({ is_archived: nextArchived } as never)
      .eq("tenant_id", context.currentTenant.id)
      .eq("id", entityId);

    if (!error && nextArchived) {
      await supabase
        .from("sub_departments")
        .update({ is_archived: true } as never)
        .eq("tenant_id", context.currentTenant.id)
        .eq("dept_id", entityId);
    }

    if (error) {
      console.error("Failed to update department archive state", error);
      redirectWithError(locale, "Kunne ikke oppdatere avdelingen akkurat nå.");
    }
  } else if (entityType === "subDepartment") {
    const { error } = await supabase
      .from("sub_departments")
      .update({ is_archived: nextArchived } as never)
      .eq("tenant_id", context.currentTenant.id)
      .eq("id", entityId);

    if (error) {
      console.error("Failed to update sub-department archive state", error);
      redirectWithError(locale, "Kunne ikke oppdatere underavdelingen akkurat nå.");
    }
  } else {
    redirectWithError(locale, "Ukjent strukturtype.");
  }

  revalidateStructurePaths(locale);
  redirectWithSuccess(
    locale,
    nextArchived ? "Strukturenheten ble arkivert." : "Strukturenheten ble aktivert igjen.",
  );
}
