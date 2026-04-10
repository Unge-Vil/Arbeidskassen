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
      title="Noe gikk galt i Sales Portal"
      message="Salgssiden kunne ikke fullføres akkurat nå. Prøv igjen om litt."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
