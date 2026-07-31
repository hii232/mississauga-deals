// Curated fallback shown when Supabase (via /api/precon) is unreachable —
// e.g. env-less builds or a transient outage. Shared by the server page
// (app/(public)/pre-construction/projects/page.js) and its client component
// so the two can never disagree about what "no data" renders as.
// Keep entries real and current-ish; this is public-facing copy.
export const FALLBACK_PROJECTS = [
  { name: 'M6 Condos (M City)', developer: 'Rogers Real Estate & Urban Capital', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 57, units: 900, price_from: 440900, status: 'Selling', completion: '2028' },
  { name: 'Canopy Towers 2', developer: 'Liberty Development Corp', city: 'Mississauga', area: 'Hurontario Corridor', type: 'Condo', storeys: 38, units: 522, price_from: 476900, status: 'Selling', completion: '2027' },
  { name: 'Bridge House at Brightwater', developer: 'Kilmer, DiamondCorp, Dream & FRAM+Slokker', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Condo', storeys: 19, units: null, price_from: 649900, status: 'Selling', completion: '2028' },
];
