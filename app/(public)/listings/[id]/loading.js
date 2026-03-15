export default function Loading() {
  return (
    <main className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back link skeleton */}
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Photo skeleton */}
          <div className="lg:col-span-3">
            <div className="aspect-[16/10] animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-20 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          </div>

          {/* Info card skeleton */}
          <div className="lg:col-span-2">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200" />
                <div className="flex gap-2">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                </div>
              </div>
              <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="flex gap-3">
                <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-12 animate-pulse rounded bg-slate-200" />
                <div className="h-12 animate-pulse rounded bg-slate-200" />
                <div className="h-12 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="h-px w-full bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mt-8">
          <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-24 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-4">
              <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
