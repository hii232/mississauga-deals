'use client';

import { useRouter } from 'next/navigation';

// GTA city grouping — mirrors the header GTA mega-menu (header.js GTA_GROUPS).
// Kept here so the switcher is self-contained; keep the two in sync.
const GTA_GROUPS = [
  { region: 'Peel', cities: ['Brampton', 'Caledon'] },
  { region: 'Halton', cities: ['Oakville', 'Burlington', 'Milton', 'Halton Hills', 'Georgetown'] },
  { region: 'Toronto', cities: ['Toronto (All)', 'Etobicoke', 'North York', 'Scarborough', 'East York', 'York'] },
  { region: 'York Region', cities: ['Vaughan', 'Richmond Hill', 'Markham', 'Aurora', 'Newmarket', 'King'] },
  { region: 'Durham', cities: ['Pickering', 'Ajax', 'Whitby', 'Oshawa', 'Clarington'] },
  { region: 'Hamilton + West', cities: ['Hamilton', 'Stoney Creek', 'Dundas', 'Ancaster'] },
];

// The URL value for a city. "Toronto (All)" maps to city=Toronto, which
// /api/listings-gta expands to every Toronto sub-area.
function cityValue(city) {
  return city === 'Toronto (All)' ? 'Toronto' : city;
}

/**
 * Region switcher — lets a visitor jump between Mississauga (the flagship
 * /listings page), All GTA, and any individual GTA city (the /gta?city= pages)
 * from one control. No feed change: it just navigates to the right existing
 * page, each of which keeps its own SEO.
 *
 * `current` is the selected option value: 'mississauga', 'all-gta', or a city
 * name (e.g. 'Toronto', 'Brampton').
 */
export function RegionSwitcher({ current = 'mississauga', className = '' }) {
  const router = useRouter();

  function handleChange(e) {
    const v = e.target.value;
    if (v === 'mississauga') router.push('/listings');
    else if (v === 'all-gta') router.push('/gta');
    else router.push('/gta?city=' + encodeURIComponent(v));
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <label htmlFor="region-switcher" className="whitespace-nowrap text-sm font-medium text-muted">
        <span aria-hidden="true">📍</span> Area
      </label>
      <select
        id="region-switcher"
        value={current}
        onChange={handleChange}
        aria-label="Choose an area to browse investment listings"
        className="max-w-[60vw] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        <option value="mississauga">Mississauga</option>
        <option value="all-gta">All GTA</option>
        {GTA_GROUPS.map((g) => (
          <optgroup key={g.region} label={g.region}>
            {g.cities.map((c) => (
              <option key={c} value={cityValue(c)}>{c}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
