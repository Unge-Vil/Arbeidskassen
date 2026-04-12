"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AppErrorState } from "@arbeidskassen/ui";

export default function Error({
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
      title="Noe gikk galt i Arbeidskassen"
      message="Prøv å laste siden på nytt. Hvis problemet fortsetter, kan du kontakte support."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
