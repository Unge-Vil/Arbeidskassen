export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--ak-border)] border-t-[var(--ak-accent)]" />
    </div>
  );
}
