"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AppErrorState } from "@arbeidskassen/ui";

export default function SalesPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <AppErrorState
      title="Salgsportalen er utilgjengelig"
      message="Noe gikk galt i Salgsportalen. Prøv å laste siden på nytt."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
