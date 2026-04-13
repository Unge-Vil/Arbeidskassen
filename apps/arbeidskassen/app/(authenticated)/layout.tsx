import { Suspense } from "react";
import type { ReactNode } from "react";
import { AuthenticatedShellSkeleton } from "./authenticated-shell-skeleton";
import AuthenticatedLayoutContent from "./authenticated-layout-content";

/**
 * AuthenticatedLayout
 *
 * Synchronous wrapper that immediately streams the shell skeleton to the
 * client. AuthenticatedLayoutContent — the async component that fetches
 * getShellContext() — resolves inside the Suspense boundary, replacing the
 * skeleton once auth context is ready.
 *
 * This implements plan item 2.5: Suspense-grense i authenticated layout.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<AuthenticatedShellSkeleton />}>
      <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
    </Suspense>
  );
}
