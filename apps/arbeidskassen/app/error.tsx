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
      title="Noe gikk galt i Arbeidskassen"
      message="Prøv å laste siden på nytt. Hvis problemet fortsetter, kan du kontakte support."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
