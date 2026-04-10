"use client";

import { useEffect } from "react";
import { AppErrorState } from "@arbeidskassen/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppErrorState
      title="Noe gikk galt i Backoffice"
      message="Den interne adminvisningen svarte ikke som forventet. Prøv igjen."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
