import type { Database } from "./types";

export type TenantRole = Database["public"]["Enums"]["tenant_role"];

export const PLATFORM_PERMISSION_DEFINITIONS = [
  {
    key: "organization.manage_structure",
    group: "Organisasjon",
    label: "Administrere struktur",
    description: "Opprette, flytte og arkivere virksomheter, avdelinger og underavdelinger.",
  },
  {
    key: "organization.manage_members",
    group: "Organisasjon",
    label: "Administrere medlemmer",
    description: "Invitere, deaktivere og flytte brukere i organisasjonen.",
  },
  {
    key: "organization.manage_roles",
    group: "Organisasjon",
    label: "Administrere roller og tilganger",
    description: "Opprette custom roller og styre granular permissions.",
  },
  {
    key: "organization.manage_billing",
    group: "Organisasjon",
    label: "Administrere fakturering",
    description: "Endre abonnement, billing-metode og fakturagrunnlag.",
  },
  {
    key: "bookdet.view",
    group: "BookDet",
    label: "Se BookDet-data",
    description: "Åpne BookDet og lese bookingrelatert innhold.",
  },
  {
    key: "bookdet.manage",
    group: "BookDet",
    label: "Endre BookDet-data",
    description: "Opprette og redigere bookingressurser, oppdrag og innstillinger.",
  },
  {
    key: "today.view",
    group: "Today",
    label: "Se Today-data",
    description: "Åpne Today og lese oversikter, oppgaver og planer.",
  },
  {
    key: "today.manage",
    group: "Today",
    label: "Endre Today-data",
    description: "Opprette og oppdatere oppgaver, planer og daglige arbeidsflater.",
  },
  {
    key: "arbeidskassen.use_tools",
    group: "Arbeidskassen",
    label: "Bruke verktøy og moduler",
    description: "Tilgang til delte verktøy, dashboards og modulflater i plattformen.",
  },
  {
    key: "ai.use",
    group: "AI",
    label: "Bruke AI-funksjoner",
    description: "Starte AI-drevne assistenter og bruke kredittbaserte funksjoner.",
  },
  {
    key: "ai.manage_credits",
    group: "AI",
    label: "Administrere AI-credits",
    description: "Se og justere kredittbruk og kredittrelaterte innstillinger.",
  },
] as const;

export type PlatformPermissionDefinition = (typeof PLATFORM_PERMISSION_DEFINITIONS)[number];
export type PlatformPermissionKey = PlatformPermissionDefinition["key"];
export type PermissionMap = Record<PlatformPermissionKey, boolean>;

export const PLATFORM_PERMISSION_KEYS = PLATFORM_PERMISSION_DEFINITIONS.map(
  (definition) => definition.key,
) as PlatformPermissionKey[];

export const DEFAULT_ROLE_PERMISSIONS: Record<TenantRole, PlatformPermissionKey[]> = {
  owner: [...PLATFORM_PERMISSION_KEYS],
  admin: [
    "organization.manage_structure",
    "organization.manage_members",
    "organization.manage_roles",
    "bookdet.view",
    "bookdet.manage",
    "today.view",
    "today.manage",
    "arbeidskassen.use_tools",
    "ai.use",
    "ai.manage_credits",
  ],
  member: [
    "bookdet.view",
    "bookdet.manage",
    "today.view",
    "today.manage",
    "arbeidskassen.use_tools",
    "ai.use",
  ],
  viewer: ["bookdet.view", "today.view", "arbeidskassen.use_tools"],
};

export function normalizePermissionKeys(value: unknown): PlatformPermissionKey[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (permission): permission is PlatformPermissionKey =>
      typeof permission === "string" && PLATFORM_PERMISSION_KEYS.includes(permission as PlatformPermissionKey),
  );
}

export function createPermissionMap(
  permissions: readonly PlatformPermissionKey[] | readonly string[],
): PermissionMap {
  const entries = PLATFORM_PERMISSION_KEYS.map((permissionKey) => [
    permissionKey,
    permissions.includes(permissionKey),
  ]);

  return Object.fromEntries(entries) as PermissionMap;
}

export function getPermissionDefinitionsByGroup(): Record<string, PlatformPermissionDefinition[]> {
  return PLATFORM_PERMISSION_DEFINITIONS.reduce<Record<string, PlatformPermissionDefinition[]>>(
    (groups, definition) => {
      groups[definition.group] = [...(groups[definition.group] ?? []), definition];
      return groups;
    },
    {},
  );
}

export function countPermissions(permissions: readonly PlatformPermissionKey[] | readonly string[]): number {
  return createPermissionMap(permissions)
    ? normalizePermissionKeys([...permissions]).length
    : 0;
}
