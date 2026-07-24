import Link from 'next/link';
import { fmtK } from '@/lib/utils/format';
import { NeighbourhoodScene } from '@/components/art/neighbourhood-scene';
import { neighbourhoodPhoto } from '@/lib/neighbourhood-images';

const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-');

const TREND_BADGE = {
  hot: 'bg-red-500 text-white',
  warm: 'bg-amber-400 text-navy',
  cool: 'bg-sky-400 text-navy',
};

/**
 * Premium, image-forward neighbourhood card used on the homepage preview and the
 * /neighbourhoods index. Shows a real photo when one exists in the manifest,
 * otherwise a place-specific illustrated landmark scene. The whole card links to
 * the neighbourhood's investment guide.
 */
export function NeighbourhoodCard({ name, data, avgPrice, avgDOM, rentYield, isLive = false }) {
  const photo = neighbourhoodPhoto(name);
  // Prefer live-listing overrides when provided (homepage), else curated data.
  const price = typeof avgPrice === 'number' ? avgPrice : data.avgPrice;
  const dom = typeof avgDOM === 'number' ? avgDOM : data.avgDOM;
  const yieldPct = typeof rentYield === 'number' ? rentYield : (typeof data.rentYield === 'number' ? data.rentYield : null);
  const yoy = typeof data.priceYoY === 'number' ? data.priceYoY : null;
  const badge = TREND_BADGE[data.trend] || 'bg-slate-400 text-white';

  return (
    <Link
      href={`/neighbourhoods/${slugify(name)}`}
      className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white no-underline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Image / scene header */}
      <div className="relative h-44 overflow-hidden">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={`${name}, Mississauga`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <NeighbourhoodScene name={name} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        )}
        {/* legibility gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-transparent" />

        {/* trend badge */}
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm ${badge}`}>
          {data.emoji ? `${data.emoji} ` : ''}{data.trend}
        </span>

        {/* name + yield overlaid on the image */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-bold leading-tight text-white drop-shadow-sm">{name}</h3>
            <p className="text-[11px] font-medium text-white/70">Mississauga</p>
          </div>
          {yieldPct != null && (
            <div className="flex-shrink-0 rounded-xl bg-white/95 px-3 py-1.5 text-center shadow-md backdrop-blur">
              <p className="text-lg font-extrabold leading-none text-accent">{yieldPct}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Rent Yield</p>
            </div>
          )}
        </div>
      </div>

      {/* stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-cloud p-2">
            <p className="text-xs font-bold text-navy">{fmtK(price)}</p>
            <p className="text-[10px] text-muted">Avg Price</p>
          </div>
          <div className="rounded-lg bg-cloud p-2">
            <p className={`text-xs font-bold ${yoy != null && yoy >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {yoy == null ? '—' : `${yoy >= 0 ? '+' : ''}${yoy}%`}
            </p>
            <p className="text-[10px] text-muted">YoY</p>
          </div>
          <div className="rounded-lg bg-cloud p-2">
            <p className="text-xs font-bold text-navy">{typeof dom === 'number' ? `${dom}d` : '—'}</p>
            <p className="text-[10px] text-muted">Avg DOM</p>
          </div>
        </div>

        {isLive && (
          <p className="mt-2 flex items-center justify-center gap-1 text-[9px] font-medium text-emerald-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live from active listings
          </p>
        )}

        {data.note && (
          <p className="mt-3 line-clamp-2 text-[11px] italic leading-snug text-muted">
            &ldquo;{data.note}&rdquo;
          </p>
        )}

        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent transition-colors group-hover:text-accent-dark">
          View investment guide
          <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
