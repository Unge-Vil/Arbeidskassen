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
      title="Noe gikk galt i TeamArea"
      message="Vi klarte ikke å laste teamfeeden akkurat nå. Prøv igjen om et øyeblikk."
      errorId={error.digest}
      onRetry={reset}
    />
  );
}
