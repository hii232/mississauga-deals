export default function ListingsLoading() {
  return (
    <main className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 w-72 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-100" />
        </div>

        {/* Deal screener skeleton */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-cloud px-3 py-2">
                <div className="mx-auto h-3 w-12 animate-pulse rounded bg-slate-200" />
                <div className="mx-auto mt-1.5 h-5 w-10 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Search skeleton */}
        <div className="mb-6 h-12 animate-pulse rounded-lg bg-slate-200" />

        {/* Chips skeleton */}
        <div className="mb-4 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>

        {/* Controls skeleton */}
        <div className="mb-6 flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="flex gap-3">
            <div className="h-10 w-36 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="h-48 animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
                <div className="flex gap-3">
                  <div className="h-3 w-12 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-12 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="grid grid-cols-4 gap-2 rounded-lg bg-cloud p-2.5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="text-center">
                      <div className="mx-auto h-2.5 w-8 animate-pulse rounded bg-slate-200" />
                      <div className="mx-auto mt-1 h-4 w-8 animate-pulse rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
