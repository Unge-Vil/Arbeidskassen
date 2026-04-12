"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body>
        <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h2>Noe gikk galt</h2>
          <p>Prøv å laste siden på nytt.</p>
          <button onClick={reset}>Prøv igjen</button>
        </div>
      </body>
    </html>
  );
}
