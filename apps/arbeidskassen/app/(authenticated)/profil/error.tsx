"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AppErrorState } from "@arbeidskassen/ui";

export default function ProfilError({
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
      title="Profil er utilgjengelig"
      message="Noe gikk galt ved lasting av profilen din. Prøv å laste siden på nytt."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
