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
      title="Noe gikk galt i Organisasjon"
      message="Denne visningen kunne ikke lastes akkurat nå. Prøv på nytt."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
