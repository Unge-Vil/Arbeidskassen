"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AppErrorState } from "@arbeidskassen/ui";

export default function BackofficeError({
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
      title="Backoffice er utilgjengelig"
      message="Noe gikk galt i Backoffice. Prøv å laste siden på nytt."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
