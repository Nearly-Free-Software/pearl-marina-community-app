export default function AppLoading() {
  return (
    <main className="min-h-screen" aria-busy="true" aria-label="Loading page">
      <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-secondary">
        <div className="h-full w-1/3 animate-[route-progress_1s_ease-in-out_infinite] bg-primary motion-reduce:animate-none" />
      </div>
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-5 sm:px-8">
          <div className="h-9 w-36 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-56 animate-pulse rounded-xl border bg-card motion-reduce:animate-none" />
          <div className="h-56 animate-pulse rounded-xl border bg-card motion-reduce:animate-none" />
        </div>
      </div>
      <p className="sr-only" role="status">Loading, please wait.</p>
    </main>
  );
}
