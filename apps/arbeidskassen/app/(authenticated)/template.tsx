import type { ReactNode } from "react";

export default function AuthenticatedTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="ak-page-transition">{children}</div>;
}
