"use client"

import { AlertTriangle, RefreshCcw } from "lucide-react"

import { Button } from "../ui/button"

type AppErrorStateProps = {
  title?: string
  message?: string
  errorId?: string
  retryLabel?: string
  onRetry?: () => void
}

export function AppErrorState({
  title = "Noe gikk galt",
  message = "Prøv å laste siden på nytt. Hvis problemet fortsetter, kan du kontakte support.",
  errorId,
  retryLabel = "Prøv igjen",
  onRetry,
}: AppErrorStateProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--ak-border)] bg-[var(--ak-panel)] p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ak-accent)]/10 text-[var(--ak-accent)]">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 className="text-xl font-semibold text-[var(--ak-text-main)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--ak-text-muted)]">{message}</p>

        {errorId ? (
          <p className="mt-3 text-xs text-[var(--ak-text-muted)]">
            Referanse: <code>{errorId}</code>
          </p>
        ) : null}

        <div className="mt-6 flex justify-center">
          <Button onClick={onRetry} type="button">
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
