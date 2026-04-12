import type { Metadata } from "next";
import { OrganizationShell } from "./organization-shell";

export const metadata: Metadata = {
  title: "Organisasjon",
  description: "Organisasjon — administrasjonsmodul i Arbeidskassen",
};

export default function OrganisasjonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OrganizationShell>{children}</OrganizationShell>;
}
