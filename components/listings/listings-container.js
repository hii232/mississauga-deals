'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { usePhotoFallback } from '@/lib/listings/use-photo-fallback';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { fmtK, fmtNum, pct1 } from '@/lib/utils/format';
import { scoreColorHex } from '@/lib/deal-score';
import { DealScreener } from './deal-screener';
import { ListingGrid } from './listing-grid';
import { ListingTable } from './listing-table';
import { InvestorFilters } from './investor-filters';
import { DEFAULT_FILTERS, applyFilters, serializeFilters, deserializeFilters, hasNoActiveFilters } from './filter-utils';

const ListingMap = dynamic(() => import('./listing-map').then(m => m.ListingMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-xl border border-slate-200 bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      <span className="ml-3 text-sm text-muted">Loading map...</span>
    </div>
  ),
});

// ── Top Picks Card ──
// isRegistered gates the actual VALUES, not just their opacity. The overlay
// below used to be the only gate - a CSS blur-sm over the real numbers - so
// "Top N cash-flowing deals are locked" sat directly above CAP/CF/CoC text
// that was still genuinely present and legible in the DOM (blur is a paint
// effect, not a data boundary). Now an unregistered visitor never receives
// the real figures for these cards at all, so the "locked" copy is true.
function TopPickCard({ listing, photo, isRegistered }) {
  const [showPhoto, onPhotoError] = usePhotoFallback(photo);
  const scoreHex = scoreColorHex(listing.hamzaScore);
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="relative flex-shrink-0 w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-lg no-underline"
    >
      {/* Photo */}
      <div className="relative h-36 w-full overflow-hidden">
        {showPhoto ? (
          <Image src={photo} alt={listing.address} fill sizes="280px" onError={onPhotoError} className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
            </svg>
          </div>
        )}
        {/* Score badge */}
        <div
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: scoreHex }}
        >
          {typeof listing.hamzaScore === 'number' && isFinite(listing.hamzaScore) ? listing.hamzaScore : '-'}
        </div>
        {/* CF+ badge. Unconditional here because the parent TopPicks already
            filters to cashFlow > 0 before rendering this card - every listing
            in this carousel genuinely qualifies.
            bg-emerald-500/90 measured 2.39:1 for white text over a light
            photo - opaque emerald-700 = 5.48:1, same fix as its twin on the
            main listing-card.js badge. */}
        <span className="absolute left-2 top-2 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          Cash Flowing
        </span>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-navy line-clamp-1">{listing.address}</p>
        <p className="text-base font-bold text-navy">{fmtK(listing.price)}</p>
        <div className="mt-1.5 grid grid-cols-3 gap-0.5 text-center rounded-md bg-cloud p-1.5">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase text-slate-500">CAP</p>
            <p className="text-[11px] font-bold text-navy truncate">{isRegistered ? pct1(listing.capRate) : '••••'}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase text-slate-500">CF/mo</p>
            <p className="text-[11px] font-bold text-emerald-700 truncate">{isRegistered ? (Number.isFinite(listing.cashFlow) ? `${listing.cashFlow >= 0 ? '+' : '-'}$${Math.abs(Math.round(listing.cashFlow)).toLocaleString()}` : '-') : '••••'}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase text-slate-500">CoC</p>
            <p className="text-[11px] font-bold text-navy truncate">{isRegistered ? pct1(listing.cashOnCash) : '••••'}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Top Picks Section ──
function TopPicks({ listings, photoMap, isRegistered }) {
  const scrollRef = useRef(null);
  const topPicks = useMemo(() => {
    return listings
      .filter((l) => l.cashFlow > 0)
      .sort((a, b) => b.hamzaScore - a.hamzaScore)
      .slice(0, 6);
  }, [listings]);

  if (topPicks.length === 0) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* trophy icon - CLAUDE.md prohibits emoji in code */}
          <svg className="h-4 w-4 flex-none text-gold" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
          </svg>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Top Picks</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Best Cash Flowing Deals
          </span>
        </div>
        {isRegistered && (
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={() => scroll(-1)} className="rounded-full p-1.5 text-slate-500 hover:text-navy hover:bg-slate-100 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => scroll(1)} className="rounded-full p-1.5 text-slate-500 hover:text-navy hover:bg-slate-100 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent ${!isRegistered ? 'blur-sm pointer-events-none select-none' : ''}`}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {topPicks.map((listing) => (
            <div key={listing.id} style={{ scrollSnapAlign: 'start' }}>
              <TopPickCard listing={listing} photo={listing.photos?.[0] || photoMap[listing.id] || null} isRegistered={isRegistered} />
            </div>
          ))}
        </div>
        {!isRegistered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/60 backdrop-blur-[2px]">
            <svg className="mb-2 h-8 w-8 text-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="mb-2 text-sm font-semibold text-navy">Top {topPicks.length} cash-flowing deals are locked</p>
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-accent/90 no-underline"
            >
              Sign up free to unlock
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// initialSummary: a whole-market Deal Screener aggregate computed server-side
// over the ENTIRE active feed (/api/market-stats already walks it, so this
// costs no extra request - the /listings server render fetches that endpoint
// anyway). It lets the dashboard state correct market-wide figures from the
// first paint instead of publishing whatever the first 30 rows happen to say.
// Absent (GTA pages, or a feed that came back short) simply means the
// set-dependent tiles stay skeletons until the load finishes.
export function ListingsContainer({ initialListings, initialTotal = 0, initialPages = 0, displayTotal = 0, apiEndpoint = '/api/listings', popularHoods, city: cityProp = '', initialSummary = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL params (survives back navigation)
  const initialFilters = useMemo(() => deserializeFilters(searchParams), []);
  const initialPage = initialFilters._page || 1;

  const [listings, setListings] = useState(initialListings);
  const [filters, setFilters] = useState(initialFilters);
  const [view, setView] = useState('grid');
  const [compareIds, setCompareIds] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(initialListings.length === 0);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  // Every page of the feed is in. Until this flips, the Deal Screener must not
  // present any max/count over `listings` as a settled figure - see
  // lib/listings/screener-metrics.js for the measured damage that caused.
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Cash-flow-positive listings fetched DIRECTLY, ahead of the walk. Kept in
  // separate state on purpose: the background walk's flush() rebuilds
  // `listings` wholesale from its own pages, so rows merged into `listings`
  // here would vanish on the next flush and reappear later - matches
  // flickering in and out. These merge at render time instead (see the
  // `pool` memo) and dedupe naturally once their own pages arrive.
  const [cfFastRows, setCfFastRows] = useState(null);

  const [photoMap, setPhotoMap] = useState({});

  // Read city from URL (set by GTA mega-menu) or from the `city` prop.
  // The prop is used on path-segment pages (/gta/[city]) where no ?city= is
  // present in the URL - the city is in the pathname, not the query string.
  const cityFromUrl = searchParams.get('city') || '';
  const cityParam = cityProp || cityFromUrl;
  // Region scope for saved searches: a specific city on /gta/[city] or
  // /gta?city=X, the whole-GTA sentinel on the /gta hub, else Mississauga.
  const searchCity = cityParam || (apiEndpoint.includes('gta') ? 'GTA' : 'Mississauga');

  // Sync filters to URL (so back button restores exact filter state).
  // Preserve ?city=X when the city came from a query param (legacy /gta?city=
  // URLs redirect to /gta/[city], but this keeps the URL sync safe if ever
  // called from a non-redirected context). Do NOT add ?city= when the city
  // lives in the pathname - the path already carries it.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const qs = serializeFilters(filters);
    const params = new URLSearchParams(qs);
    if (cityFromUrl) params.set('city', cityFromUrl);
    const final = params.toString();
    const newUrl = pathname + (final ? '?' + final : '');
    router.replace(newUrl, { scroll: false });
  }, [filters, pathname, router, cityFromUrl]);

  // Save scroll position before navigating away (restored on back)
  useEffect(() => {
    const saveScroll = () => sessionStorage.setItem('listings_scroll', String(window.scrollY));
    window.addEventListener('beforeunload', saveScroll);
    // Also save on any link click within the listings
    const handleClick = (e) => {
      const link = e.target.closest('a[href*="/listings/"]');
      if (link) sessionStorage.setItem('listings_scroll', String(window.scrollY));
    };
    document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('beforeunload', saveScroll);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Restore scroll position when coming back
  useEffect(() => {
    const saved = sessionStorage.getItem('listings_scroll');
    if (saved && listings.length > 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, Number(saved));
        sessionStorage.removeItem('listings_scroll');
      });
    }
  }, [listings.length > 0]);

  useEffect(() => {
    setIsRegistered(localStorage.getItem('user_registered') === 'true');
  }, []);

  // Fetch photos via /api/photos-batch (25 at a time) for listings missing photos.
  // Fires 4 parallel batch calls immediately (100 photos), then queues the rest.
  const photoBatchRef = useRef(new Set()); // IDs already requested
  const photoQueueRef = useRef([]);        // IDs waiting to be fetched
  const photoTimerRef = useRef(null);      // background drainer timer

  // Helper: fetch a batch of photos (up to 25) via batch endpoint.
  // GET, not POST: Vercel's CDN only caches GET responses, so with POST every
  // visitor scrolling the same page re-paid 25 upstream media queries. IDs are
  // sorted so two visitors covering the same listings produce the same cache
  // key regardless of arrival order.
  const fetchPhotoBatch = useCallback(async (ids) => {
    try {
      const res = await fetch(`/api/photos-batch?ids=${encodeURIComponent([...ids].sort().join(','))}`);
      if (!res.ok) throw new Error('batch failed');
      const data = await res.json();
      const photos = data?.photos || {};
      if (Object.keys(photos).length > 0) {
        setPhotoMap((prev) => ({ ...prev, ...photos }));
      }
    } catch {
      // Batch failed - fall back to individual calls for this chunk
      for (const id of ids) {
        fetch('/api/photos?id=' + encodeURIComponent(id) + '&limit=1')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            const url = d?.photos?.[0];
            if (url) setPhotoMap((prev) => ({ ...prev, [id]: url }));
          })
          .catch(() => {});
      }
    }
  }, []);

  // When listings change, queue new IDs that need photos
  useEffect(() => {
    if (listings.length === 0) return;

    const newIds = listings
      .filter((l) => !l.photos?.length && !photoBatchRef.current.has(l.id))
      .map((l) => l.id);
    if (newIds.length === 0) return;

    // Mark as requested immediately
    for (const id of newIds) photoBatchRef.current.add(id);

    // Fire 4 parallel batch calls immediately (covers first 100 visible listings)
    const BATCH_SIZE = 25;
    const immediateBatches = [];
    for (let i = 0; i < Math.min(newIds.length, 100); i += BATCH_SIZE) {
      immediateBatches.push(newIds.slice(i, i + BATCH_SIZE));
    }
    const rest = newIds.slice(100);

    // Fire all 4 batches in parallel for fastest initial load
    for (const batch of immediateBatches) {
      fetchPhotoBatch(batch);
    }

    // Queue the rest - 25 at a time, fire 2 parallel batches every 500ms
    if (rest.length > 0) {
      photoQueueRef.current.push(...rest);

      if (!photoTimerRef.current) {
        photoTimerRef.current = setInterval(() => {
          if (photoQueueRef.current.length === 0) {
            clearInterval(photoTimerRef.current);
            photoTimerRef.current = null;
            return;
          }
          // Fire 2 parallel batches each tick
          const chunk1 = photoQueueRef.current.splice(0, BATCH_SIZE);
          if (chunk1.length > 0) fetchPhotoBatch(chunk1);
          const chunk2 = photoQueueRef.current.splice(0, BATCH_SIZE);
          if (chunk2.length > 0) fetchPhotoBatch(chunk2);
        }, 500);
      }
    }
  }, [listings, fetchPhotoBatch]);

  // Cleanup background timer on unmount
  useEffect(() => {
    return () => {
      if (photoTimerRef.current) clearInterval(photoTimerRef.current);
    };
  }, []);

  // Loads the rest of the inventory. Two starting states:
  //  - Cold start (no SSR data): fetch page 1 ourselves and show it instantly.
  //  - SSR already primed page 1 (the common case since /listings and /gta
  //    became server-rendered): skip straight to background-loading pages
  //    2+. This used to bail out entirely whenever SSR provided ANY rows
  //    ("if (initialListings.length > 0) return"), which meant the site was
  //    permanently capped at whatever the server's single page fetched
  //    (~198 rows) even though the real feed has thousands - every count
  //    claim above ~200 was comparing against data the page never loaded.
  // Either way, remaining pages load in the background and get appended.
  useEffect(() => {
    let cancelled = false;
    setAnalysisComplete(false);
    async function fetchRemaining() {
      try {
        const { processListings } = await import('@/lib/listings/process-listings');
        const cityQs = cityParam ? '&city=' + encodeURIComponent(cityParam) : '';

        let page1Processed = [];
        let totalPages;

        if (initialListings.length === 0) {
          // Cold start - fetch page 1 ourselves and show it immediately.
          // 20s budget: page 1 is the whole difference between a page and a
          // blank screen (worth waiting longer than the background pages),
          // but a hang here used to leave the skeletons up forever.
          const res = await fetch(apiEndpoint + '?limit=100&page=1' + cityQs, {
            signal: AbortSignal.timeout(20000),
          });
          if (!res.ok) {
            // Feed down: stop the skeletons and show an honest error state
            if (!cancelled) { setIsLoading(false); setLoadError(true); }
            return;
          }
          const data = await res.json();
          page1Processed = processListings(data.listings || data || []);
          totalPages = data.pages || 1;

          if (!cancelled) {
            setLoadError(false);
            setIsLoading(false);
            if (page1Processed.length > 0) setListings(page1Processed);
          }
        } else {
          // SSR already gave us page 1 (processed) - work out how many more
          // pages exist from the real total instead of guessing.
          // Prefer the API's own page count. Deriving it here from the
          // POST-filter total over the RAW page size computed 13 where the
          // API said 14 - the last page was never fetched and its listings
          // were unreachable everywhere on the site.
          totalPages = initialPages > 0 ? initialPages : initialTotal > 0 ? Math.ceil(initialTotal / 200) : 1;
        }

        // Whichever base we started from - SSR's already-processed rows, or
        // this run's own page 1. Processed exactly ONCE now: the old code
        // re-ran processListings(page1Raw) inside every merge, re-underwriting
        // the same 100 listings once per batch on a cold start.
        const base = initialListings.length > 0 ? initialListings : page1Processed;

        // ── Background-load the rest of the inventory ──
        if (totalPages > 1 && !cancelled) {
          // 100 pages × 100 rows: the feed page size halved (media-expand
          // cap), so the page budget doubles to keep the same ~10k-listing
          // background coverage on the GTA hub. /listings needs ~26.
          const maxPages = Math.min(totalPages, 100);

          // A worker POOL, not fixed waves. The old loop awaited a whole batch
          // of five before requesting the next five, so the slowest page in
          // each batch held up every request behind it and the number of
          // in-flight requests drained to zero between batches - 25 pages cost
          // five full round trips of the SLOWEST page each. A pool keeps
          // CONCURRENCY requests in flight continuously instead. Peak
          // concurrency is essentially unchanged (5 → 6, matching the
          // server-side batch size documented in lib/listings/fetch-feed.js),
          // so this does NOT enlarge the burst the upstream feed sees; it just
          // stops the pipeline idling between waves.
          const CONCURRENCY = 6;
          const pageRows = new Array(maxPages + 1); // processed rows, one slot per page
          const failed = [];
          let nextPage = 2;
          let flushedTo = 1;    // highest page whose rows are on screen
          let lastFlush = 0;

          // Rebuild the visible list from the contiguous run of pages that have
          // landed. Contiguous, not "whatever finished", so page order - and
          // therefore the rendered order - is byte-identical to the old
          // sequential-batch behaviour even though the fetches complete out of
          // order.
          const flush = (force) => {
            if (cancelled) return;
            while (flushedTo + 1 <= maxPages && pageRows[flushedTo + 1] !== undefined) flushedTo++;
            const now = Date.now();
            // Coalesce: one re-render every ~250ms rather than one per page.
            if (!force && now - lastFlush < 250) return;
            lastFlush = now;
            // Dedupe key matches process-listings' own address+price dedupe.
            const seen = new Set(base.map((l) => l.address + '|' + l.price));
            const merged = [...base];
            for (let p = 2; p <= flushedTo; p++) {
              for (const l of pageRows[p] || []) {
                const key = l.address + '|' + l.price;
                if (seen.has(key)) continue;
                seen.add(key);
                merged.push(l);
              }
            }
            if (merged.length > base.length) setListings(merged);
          };

          // Each page is underwritten ONCE, as it arrives. The old code re-ran
          // processListings over the whole accumulated array on every batch -
          // ~7,500 listings' worth of mortgage/NOI/cap-rate/score math for a
          // 2,500-listing market, all of it on the phone's main thread, and it
          // grew quadratically with the GTA hub's 100 pages. Now it is linear.
          // Nothing about the per-listing calculation changes: the same
          // function, over the same rows, in the same order.
          const loadPage = async (p) => {
            try {
              // 15s timeout, same budget as the server-side walk. Without one,
              // a single hung response wedges its worker FOREVER - and with 6
              // workers, 6 hung responses freeze the whole scan. That is
              // exactly what production showed on 2026-08-08: "130 of 2,451
              // analyzed" (SSR's 30 + one page) sitting unchanged for an hour
              // on Hamza's phone. A timed-out page goes through the same
              // failed->retry path as a 5xx instead of blocking the pool.
              const r = await fetch(apiEndpoint + '?limit=100&page=' + p + cityQs, {
                signal: AbortSignal.timeout(15000),
              });
              if (!r.ok) throw new Error('page ' + p);
              const pg = await r.json();
              pageRows[p] = processListings(pg?.listings || []);
              return true;
            } catch {
              pageRows[p] = null;
              return false;
            }
          };

          const worker = async () => {
            while (!cancelled) {
              const p = nextPage++;
              if (p > maxPages) return;
              if (!(await loadPage(p))) failed.push(p);
              flush(false);
            }
          };
          await Promise.all(
            Array.from({ length: Math.min(CONCURRENCY, maxPages - 1) }, () => worker())
          );

          // One retry for pages that dropped. These used to be swallowed
          // silently and lost for the whole session - a dropped page is ~100
          // listings missing from the counts, the map and the filters, with
          // nothing to say so. Sequential, so a retry storm can't hammer the
          // feed.
          for (const p of failed) {
            if (cancelled) break;
            await loadPage(p);
          }
          flush(true);
        }

        // Every page that was going to arrive has arrived. Only now may the
        // Deal Screener present counts and maxima over this set as final.
        if (!cancelled) setAnalysisComplete(true);
      } catch {
        if (!cancelled) { setIsLoading(false); setLoadError(true); }
      }
    }
    fetchRemaining();
    return () => { cancelled = true; };
  }, [initialListings, initialTotal, initialPages, cityParam, apiEndpoint, retryKey]);

  const toggleCompare = useCallback((id) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    );
  }, []);

  // The Cash Flowing chip lives in activeStrategies; ?cf= deep-links (emails,
  // the cash-flow guide) arrive as minCashFlow. Either means the visitor is
  // hunting cash flow. NOTE: an earlier pass keyed this off `filters.cf`,
  // which does not exist in DEFAULT_FILTERS - the market-count line never
  // rendered. This is the corrected predicate.
  const cfFilterActive =
    (filters.activeStrategies || []).includes('cf') || Number(filters.minCashFlow) > 0;

  // ── Cash-flow fast path ──
  // ~6 of ~2,450 listings cash flow, and they are scattered through a feed
  // the walk streams in arbitrary order - so the Cash Flowing filter shows
  // "0 matches" for most of a ~30-60s scan, which reads as broken (Hamza,
  // 2026-08-08: "people don't have time for shit to load"). The server's
  // daily market walk already knows exactly which listings they are and now
  // publishes their IDs (screener.cfPlusIds); fetch those few directly and
  // show them in seconds, while the full walk continues for completeness.
  // Mississauga only - the GTA pages' summary comes from a different
  // aggregate that doesn't publish IDs.
  useEffect(() => {
    if (!cfFilterActive || analysisComplete || cfFastRows !== null) return;
    if (apiEndpoint !== '/api/listings') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/market-stats', { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const stats = await res.json();
        const ids = Array.isArray(stats?.screener?.cfPlusIds) ? stats.screener.cfPlusIds.slice(0, 12) : [];
        if (!ids.length || cancelled) { if (!cancelled) setCfFastRows([]); return; }
        const { processListings } = await import('@/lib/listings/process-listings');
        const raws = await Promise.all(
          ids.map((id) =>
            fetch('/api/listing-single?id=' + encodeURIComponent(id), { signal: AbortSignal.timeout(10000) })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );
        // Same raw->processed path the detail page uses (processListings on
        // the single-listing payload), so every figure matches the cards the
        // walk would eventually produce for the same rows.
        const rows = processListings(raws.map((d) => d?.listing).filter(Boolean));
        if (!cancelled) setCfFastRows(rows);
      } catch {
        if (!cancelled) setCfFastRows([]); // tried and failed - don't retry every render
      }
    })();
    return () => { cancelled = true; };
  }, [cfFilterActive, analysisComplete, cfFastRows, apiEndpoint]);

  // Render-time merge of the fast-path rows (never merged into `listings` -
  // see the cfFastRows comment). Dedupe key matches the walk's own.
  const pool = useMemo(() => {
    if (!cfFastRows?.length || analysisComplete) return listings;
    const seen = new Set(listings.map((l) => l.address + '|' + l.price));
    const extra = cfFastRows.filter((l) => !seen.has(l.address + '|' + l.price));
    return extra.length ? [...listings, ...extra] : listings;
  }, [listings, cfFastRows, analysisComplete]);

  const filtered = useMemo(() => applyFilters(pool, filters), [pool, filters]);
  // Sorting reorders the set but never changes its membership, so it does not
  // disqualify the whole-market summary.
  const unfiltered = useMemo(() => hasNoActiveFilters(filters), [filters]);

  // Store filtered listing IDs in localStorage for prev/next navigation on detail page
  useEffect(() => {
    if (filtered.length > 0) {
      localStorage.setItem('browse_listing_ids', JSON.stringify(filtered.map(l => l.id)));
    }
  }, [filtered]);

  const compareListings = useMemo(
    () => listings.filter((l) => compareIds.includes(l.id)),
    [listings, compareIds]
  );

  return (
    <div className="space-y-6">
      {/* Deal Screener */}
      {/* marketTotal: prefer the canonical site-wide count (market-stats
          activeCount - the same number the homepage, /about and /sell quote)
          so one crawl never reads different totals on different pages;
          initialTotal (the feed's own browsable count) is the fallback and
          still drives the pagination math. */}
      {/* analysisComplete/loadedCount/summary: see deal-screener.js. The
          server summary describes the WHOLE market, so it is only handed over
          while no filter narrows the set - the moment a filter is on, the only
          honest answer for an unfinished load is a skeleton. */}
      <DealScreener
        listings={filtered}
        loading={isLoading}
        marketTotal={displayTotal || initialTotal}
        analysisComplete={analysisComplete}
        loadedCount={listings.length}
        summary={unfiltered ? initialSummary : null}
      />

      {/* Top Picks - highest-scored CF+ deals */}
      <TopPicks listings={listings} photoMap={photoMap} isRegistered={isRegistered} />

      {/* Investor Filters */}
      {/* totalCount is the MARKET total, not the loaded slice - passing
          listings.length made the "of N" clause unreachable (equal to
          resultCount when unfiltered), so the SSR view read "Showing 199
          investment properties" as if that were the whole market. */}
      <InvestorFilters filters={filters} setFilters={setFilters} resultCount={filtered.length} totalCount={Math.max(displayTotal || initialTotal || 0, listings.length)} popularHoods={popularHoods} searchCity={searchCity} />

      {/* Motivated-seller context band - the email campaign and social links
          land people on /listings?sort=dom with zero explanation of what
          they're looking at. Shown only in that sort so the page narrates the
          view ("longest-waiting sellers first") and routes the intent into the
          alerts capture path. Display-only; sorting is untouched. */}
      {filters.sortKey === 'dom' && filtered.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gold" aria-hidden="true" />
            <p className="text-sm text-navy">
              <span className="font-bold">Motivated-seller view:</span> sorted by days on market -
              longest-waiting sellers first. A seller who has already cut their price once is far
              more likely to negotiate again.
            </p>
          </div>
          <Link
            href="/alerts"
            className="flex-shrink-0 rounded-lg bg-navy px-4 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-navy/90 no-underline"
          >
            Alert me on new price cuts
          </Link>
        </div>
      )}

      {/* Signup prompt - show when not registered */}
      {!isRegistered && filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-emerald-50 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <p className="text-sm font-medium text-navy">
              Sign up free to unlock <span className="font-bold text-accent">cash flow, cap rate & deal analysis</span> on every listing
            </p>
          </div>
          <Link
            href="/signup"
            className="flex-shrink-0 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent/90 no-underline"
          >
            Sign up free
          </Link>
        </div>
      )}

      {/* View toggle */}
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-slate-200 bg-white">
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-2 text-sm ${
              view === 'grid'
                ? 'bg-navy text-white rounded-l-lg'
                : 'text-slate-500 hover:text-navy'
            }`}
            aria-label="Grid view"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-3 py-2 text-sm ${
              view === 'table'
                ? 'bg-navy text-white'
                : 'text-slate-500 hover:text-navy'
            }`}
            aria-label="Table view"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
              <rect x="1" y="1" width="14" height="3" rx="0.5" />
              <rect x="1" y="6" width="14" height="3" rx="0.5" />
              <rect x="1" y="11" width="14" height="3" rx="0.5" />
            </svg>
          </button>
          <button
            onClick={() => setView('map')}
            className={`px-3 py-2 text-sm ${
              view === 'map'
                ? 'bg-navy text-white rounded-r-lg'
                : 'text-slate-500 hover:text-navy'
            }`}
            aria-label="Map view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Listings view */}
      {view === 'grid' && (
        <ListingGrid
          listings={filtered}
          marketTotal={displayTotal || initialTotal}
          isRegistered={isRegistered}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          photoMap={photoMap}
          isLoading={isLoading}
          analysisComplete={analysisComplete}
          loadedCount={listings.length}
          loadError={loadError}
          onRetry={() => { setIsLoading(true); setLoadError(false); setRetryKey((k) => k + 1); }}
          initialPage={initialPage}
          // Whole-market cash-flow-positive count from the server screener
          // summary, shown ONLY in the still-scanning state while the Cash
          // Flowing chip is active. Cash-flowing listings are ~6 in ~2,450, so
          // the filter shows 0 matches for most of the client-side walk and
          // reads as broken (Hamza, 2026-08-08: "it doesn't load"). The page
          // KNOWS the market-wide count before the walk starts - saying it
          // turns a dead wait into an answer. Market-wide, so it stays true
          // whatever other filters are stacked on top. (cfFilterActive, not
          // filters.cf - see the predicate's comment for the bug that fixed.)
          marketCfCount={cfFilterActive && Number.isFinite(initialSummary?.cfPlusCount) ? initialSummary.cfPlusCount : null}
        />
      )}
      {view === 'table' && (
        <ListingTable
          listings={filtered}
          analysisComplete={analysisComplete}
          isRegistered={isRegistered}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          photoMap={photoMap}
        />
      )}
      {view === 'map' && (
        <ListingMap listings={filtered} photoMap={photoMap} />
      )}

      {/* Compare Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-6 py-4 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-navy">
                {compareIds.length} selected
              </span>
              <div className="flex gap-2">
                {compareListings.map((l) => (
                  <span
                    key={l.id}
                    className="inline-flex items-center gap-1 rounded-full bg-cloud px-3 py-1 text-xs text-navy"
                  >
                    {l.address.split(',')[0]}
                    <button
                      onClick={() => toggleCompare(l.id)}
                      className="ml-1 text-slate-500 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCompareIds([])}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('compare_list', JSON.stringify(compareIds));
                  localStorage.setItem('compare_data', JSON.stringify(compareListings));
                  router.push('/compare');
                }}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
              >
                Compare ({compareIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
