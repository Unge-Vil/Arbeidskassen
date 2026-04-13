"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AppErrorState } from "@arbeidskassen/ui";

export default function TeamareaError({
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
      title="Teamarea er utilgjengelig"
      message="Noe gikk galt i Teamarea. Prøv å laste siden på nytt."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
