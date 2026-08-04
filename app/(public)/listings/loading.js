export default function ListingsLoading() {
  return (
    <main className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* NOT an <h1>, and not different wording from the real page.
            This skeleton streams ahead of the server-rendered page, so both
            ended up in the HTML a crawler receives: /listings was serving TWO
            h1s, and the FIRST one - the one that carries the most weight - was
            this placeholder's "Mississauga Investment Properties" rather than
            the exact-match "Investment Properties for Sale in Mississauga"
            the page targets. A loading placeholder is not the page heading,
            so it is a plain div carrying the same text as the real h1. */}
        <div className="mb-6">
          <div className="text-3xl font-bold text-navy" aria-hidden="true">
            Investment Properties for Sale in Mississauga
          </div>
          <p className="mt-1 text-sm text-slate-500">All active listings scored and analyzed</p>
        </div>

        {/* Deal Screener skeleton */}
        <div className="mb-4 rounded-2xl bg-navy p-4 animate-pulse">
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-4 w-16 rounded bg-white/10 mb-2" />
                <div className="mx-auto h-6 w-12 rounded bg-white/20" />
              </div>
            ))}
          </div>
        </div>

        {/* Filters skeleton */}
        <div className="mb-4 space-y-3 animate-pulse">
          <div className="h-12 rounded-xl bg-white border border-slate-200" />
          <div className="flex gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-slate-100" />
            ))}
          </div>
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 w-24 rounded-full bg-slate-100" />
            ))}
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-5 w-1/3 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-10 rounded bg-slate-50" />
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
