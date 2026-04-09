import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function checkAuth(request) {
  const key = request.headers.get('x-admin-key');
  return key && key === process.env.ADMIN_SECRET;
}

const SEED_PROJECTS = [
  // ── MISSISSAUGA ──────────────────────────────────────────────────
  { name: 'M6 Condos (M City)', developer: 'Rogers Real Estate & Urban Capital', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 57, units: 900, price_from: 440900, status: 'Selling', completion: '2028' },
  { name: 'Stak36', developer: 'Daniels Corporation & Oxford Properties', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 45, units: null, price_from: 625900, status: 'Selling', completion: 'TBD' },
  { name: 'Exchange District Phase 3', developer: 'Camrost Felcorp', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 66, units: 660, price_from: null, status: 'Selling', completion: '2026' },
  { name: 'Above Condos', developer: 'Marlin Spring & RioCan Living', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 24, units: 579, price_from: 598990, status: 'Selling', completion: 'TBD' },
  { name: 'Tempo Condos', developer: 'Greenpark Group', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 40, units: 2086, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Aspire Condominiums', developer: 'The Conservatory Group', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: null, units: null, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Canopy Towers 2', developer: 'Liberty Development Corp', city: 'Mississauga', area: 'Hurontario Corridor', type: 'Condo', storeys: 38, units: 522, price_from: 476900, status: 'Selling', completion: '2027' },
  { name: 'Gemma Condos', developer: 'Pinnacle International', city: 'Mississauga', area: 'Hurontario Corridor', type: 'Condo', storeys: 35, units: 406, price_from: 750900, status: 'Selling', completion: '2026' },
  { name: 'ORO at Edge Towers', developer: 'Solmar Development Corp', city: 'Mississauga', area: 'Hurontario Corridor', type: 'Condo', storeys: 50, units: 630, price_from: 705900, status: 'Selling', completion: '2027' },
  { name: 'Bridge House at Brightwater', developer: 'Kilmer, DiamondCorp, Dream & FRAM+Slokker', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Condo', storeys: 19, units: null, price_from: 649900, status: 'Selling', completion: '2028' },
  { name: 'Exhale Condos', developer: 'Brixen Developments', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Condo', storeys: 11, units: null, price_from: 659900, status: 'Selling', completion: '2026' },
  { name: 'Aquanova Condos', developer: 'Greenpark Group', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Condo', storeys: 43, units: null, price_from: null, status: 'Coming Soon', completion: '2029' },
  { name: 'Birch Condos & Towns', developer: 'Branthaven Homes', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Mixed', storeys: null, units: null, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Pier House Towns', developer: 'Branthaven Homes', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Townhome', storeys: null, units: null, price_from: 799990, status: 'Selling', completion: 'TBD' },
  { name: 'Aura Townhomes', developer: 'Caivan Communities', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Townhome', storeys: null, units: null, price_from: 500000, status: 'Selling', completion: 'TBD' },
  { name: 'Kith Condos', developer: 'Daniels Corporation', city: 'Mississauga', area: 'Cooksville', type: 'Condo', storeys: null, units: null, price_from: 525900, status: 'Selling', completion: 'TBD' },
  { name: 'Vic Condominiums', developer: 'Forest Green Homes', city: 'Mississauga', area: 'Streetsville', type: 'Condo', storeys: 15, units: 238, price_from: 631900, status: 'Selling', completion: '2026' },
  { name: 'Reine Condos', developer: 'Lamb Development Corp', city: 'Mississauga', area: 'Streetsville', type: 'Condo', storeys: 9, units: 390, price_from: 465900, status: 'Selling', completion: '2027' },
  { name: 'High Line Condos', developer: 'Branthaven Homes', city: 'Mississauga', area: 'Erin Mills', type: 'Condo', storeys: null, units: null, price_from: 599900, status: 'Selling', completion: 'TBD' },
  { name: 'The Nine', developer: 'Mattamy Homes', city: 'Mississauga', area: 'Erin Mills', type: 'Townhome', storeys: null, units: null, price_from: 916990, status: 'Selling', completion: 'TBD' },
  { name: 'Whitehorn Woods', developer: 'National Homes', city: 'Mississauga', area: 'Erin Mills', type: 'Townhome', storeys: null, units: null, price_from: 1177990, status: 'Selling', completion: 'TBD' },
  // ── TORONTO ──────────────────────────────────────────────────────
  { name: 'Birchley Park', developer: 'Diamond Kilmer Developments', city: 'Toronto', area: 'Scarborough', type: 'Condo', storeys: null, units: null, price_from: 531900, status: 'Selling', completion: 'TBD' },
  { name: 'Motto Condos', developer: 'Sierra Communities', city: 'Toronto', area: 'West End', type: 'Condo', storeys: null, units: null, price_from: 489900, status: 'Selling', completion: 'TBD' },
  { name: 'Celeste Condominiums', developer: 'Alterra & DiamondCorp', city: 'Toronto', area: 'Downtown', type: 'Condo', storeys: null, units: null, price_from: 773990, status: 'Selling', completion: 'TBD' },
  { name: 'Untitled Toronto', developer: 'Westdale & Reserve Properties', city: 'Toronto', area: 'Midtown', type: 'Condo', storeys: null, units: null, price_from: 606900, status: 'Selling', completion: 'TBD' },
  { name: '123 Portland', developer: 'Minto Communities', city: 'Toronto', area: 'King West', type: 'Condo', storeys: null, units: null, price_from: 651900, status: 'Selling', completion: 'TBD' },
  { name: 'BLVD.Q', developer: 'Mattamy Homes Canada', city: 'Toronto', area: 'Etobicoke', type: 'Condo', storeys: null, units: null, price_from: 456855, status: 'Selling', completion: 'TBD' },
  { name: 'The Wilde Condos', developer: 'Chestnut Hill Developments', city: 'Toronto', area: 'North York', type: 'Condo', storeys: null, units: null, price_from: 559900, status: 'Selling', completion: 'TBD' },
  { name: 'The Main Tower II', developer: 'Marlin Spring & Trolleybus', city: 'Toronto', area: 'East York', type: 'Condo', storeys: null, units: null, price_from: 580990, status: 'Selling', completion: 'TBD' },
  { name: 'Keeley Condos', developer: 'TAS', city: 'Toronto', area: 'Junction', type: 'Condo', storeys: null, units: null, price_from: 399000, status: 'Selling', completion: 'TBD' },
  { name: '8 Temple Condos', developer: 'Curated Properties', city: 'Toronto', area: 'East End', type: 'Condo', storeys: null, units: null, price_from: 714900, status: 'Selling', completion: 'TBD' },
  // ── BRAMPTON ─────────────────────────────────────────────────────
  { name: 'Daniels MPV 2', developer: 'Daniels Corporation', city: 'Brampton', area: 'Mount Pleasant', type: 'Condo', storeys: null, units: null, price_from: 479900, status: 'Selling', completion: 'TBD' },
  { name: 'Duo Condos Phase 2', developer: 'National Homes & Brixen', city: 'Brampton', area: 'Downtown Brampton', type: 'Condo', storeys: null, units: null, price_from: 400000, status: 'Selling', completion: 'TBD' },
  { name: 'UPtowns at Heart Lake', developer: 'Vandyk Properties', city: 'Brampton', area: 'Heart Lake', type: 'Mixed', storeys: null, units: null, price_from: null, status: 'Selling', completion: 'TBD' },
  { name: 'Stella 2 Condos', developer: 'i2 Developments', city: 'Brampton', area: 'Downtown Brampton', type: 'Condo', storeys: null, units: null, price_from: 655000, status: 'Coming Soon', completion: '2026' },
  { name: 'Bristol Place', developer: 'Solmar Development Corp', city: 'Brampton', area: 'Downtown Brampton', type: 'Condo', storeys: null, units: null, price_from: 500000, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Bramalea Square Condos', developer: 'Essence Homes', city: 'Brampton', area: 'Bramalea', type: 'Condo', storeys: null, units: null, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  // ── VAUGHAN ──────────────────────────────────────────────────────
  { name: 'SXSW Condos', developer: 'Primont Homes', city: 'Vaughan', area: 'Vaughan Metropolitan Centre', type: 'Condo', storeys: null, units: null, price_from: 646900, status: 'Selling', completion: 'TBD' },
  { name: 'Bravo Condos', developer: 'Menkes & QuadReal', city: 'Vaughan', area: 'Vaughan Metropolitan Centre', type: 'Condo', storeys: null, units: null, price_from: null, status: 'Selling', completion: 'TBD' },
  { name: 'Artwalk Condos', developer: 'SmartCentres', city: 'Vaughan', area: 'Vaughan Metropolitan Centre', type: 'Condo', storeys: null, units: null, price_from: 600000, status: 'Coming Soon', completion: 'TBD' },
  { name: 'CG Tower Condos', developer: 'Cortel Group', city: 'Vaughan', area: 'Concord', type: 'Condo', storeys: null, units: null, price_from: 847500, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Grand Festival Condos', developer: 'Menkes Development', city: 'Vaughan', area: 'Vaughan Metropolitan Centre', type: 'Condo', storeys: null, units: null, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'V City Condos', developer: 'Liberty Development Corp', city: 'Vaughan', area: 'Concord', type: 'Condo', storeys: null, units: null, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  // ── OAKVILLE ─────────────────────────────────────────────────────
  { name: 'Soleil Condos', developer: 'Mattamy Homes', city: 'Oakville', area: 'Dundas Corridor', type: 'Condo', storeys: null, units: null, price_from: 545000, status: 'Selling', completion: 'TBD' },
  { name: 'North Oak (Oakvillage)', developer: 'Minto Communities', city: 'Oakville', area: 'Trafalgar', type: 'Condo', storeys: null, units: null, price_from: 661900, status: 'Selling', completion: 'TBD' },
  { name: 'Distrikt Trailside 2.0', developer: 'Distrikt Developments', city: 'Oakville', area: 'Dundas Corridor', type: 'Condo', storeys: null, units: null, price_from: 659900, status: 'Selling', completion: 'TBD' },
  { name: 'The Branch Condos', developer: 'Zancor Homes', city: 'Oakville', area: 'Bronte', type: 'Condo', storeys: null, units: null, price_from: 878900, status: 'Selling', completion: 'TBD' },
  { name: 'Oak and Co Condos', developer: 'Cortel Group', city: 'Oakville', area: 'Dundas Corridor', type: 'Condo', storeys: null, units: null, price_from: 918800, status: 'Selling', completion: 'TBD' },
  { name: 'Gemini South Tower', developer: 'Castleridge Homes', city: 'Oakville', area: 'Bronte', type: 'Condo', storeys: null, units: null, price_from: 756000, status: 'Selling', completion: 'TBD' },
  { name: 'NAVA Townhomes', developer: 'Digreen Homes', city: 'Oakville', area: 'West Oakville', type: 'Townhome', storeys: null, units: null, price_from: 900000, status: 'Selling', completion: 'TBD' },
  // ── MARKHAM ──────────────────────────────────────────────────────
  { name: 'Pangea Condos', developer: 'Times Group Corporation', city: 'Markham', area: 'Highway 7 Corridor', type: 'Condo', storeys: null, units: null, price_from: 629000, status: 'Selling', completion: 'TBD' },
  { name: 'Uptown Markham', developer: 'Times Group Corporation', city: 'Markham', area: 'Highway 7 Corridor', type: 'Condo', storeys: null, units: null, price_from: null, status: 'Selling', completion: 'TBD' },
  { name: 'Royal Bayview Condos', developer: 'Tridel', city: 'Markham', area: 'Bayview & Royal Orchard', type: 'Condo', storeys: null, units: null, price_from: 1600000, status: 'Selling', completion: 'TBD' },
  { name: 'Gallery Towers', developer: 'The Remington Group', city: 'Markham', area: 'Downtown Markham', type: 'Condo', storeys: null, units: null, price_from: 600000, status: 'Coming Soon', completion: 'TBD' },
  { name: 'UnionCity Condos', developer: 'Metropia', city: 'Markham', area: 'Downtown Markham', type: 'Condo', storeys: null, units: null, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  // ── RICHMOND HILL ────────────────────────────────────────────────
  { name: 'The Towns on Bayview', developer: 'Primont Homes', city: 'Richmond Hill', area: 'Bayview Corridor', type: 'Townhome', storeys: null, units: null, price_from: 1700000, status: 'Selling', completion: 'TBD' },
  { name: 'Observatory Hill', developer: 'The Conservatory Group', city: 'Richmond Hill', area: 'North Richmond Hill', type: 'Townhome', storeys: null, units: null, price_from: 2700000, status: 'Selling', completion: 'TBD' },
  { name: 'Uplands of Swan Lake', developer: 'Caliber Homes', city: 'Richmond Hill', area: 'Swan Lake', type: 'Townhome', storeys: null, units: null, price_from: 1400000, status: 'Selling', completion: 'TBD' },
  { name: 'Jefferson Heights', developer: 'Grand Grace Development', city: 'Richmond Hill', area: 'Jefferson', type: 'Townhome', storeys: null, units: null, price_from: 990000, status: 'Coming Soon', completion: 'TBD' },
  // ── HAMILTON ──────────────────────────────────────────────────────
  { name: 'Westgate on Main', developer: 'Matrix Development Group', city: 'Hamilton', area: 'Downtown Hamilton', type: 'Condo', storeys: null, units: null, price_from: 485900, status: 'Selling', completion: 'TBD' },
  { name: 'APEX Condos', developer: 'Coletara Development', city: 'Hamilton', area: 'Downtown Hamilton', type: 'Condo', storeys: null, units: null, price_from: 430000, status: 'Selling', completion: 'TBD' },
  { name: 'The Design District', developer: 'Emblem Developments', city: 'Hamilton', area: 'Downtown Hamilton', type: 'Condo', storeys: null, units: null, price_from: 400000, status: 'Selling', completion: 'TBD' },
  { name: 'Television City Condos', developer: 'Lamb Development Corp', city: 'Hamilton', area: 'Downtown Hamilton', type: 'Condo', storeys: null, units: null, price_from: 909600, status: 'Selling', completion: 'TBD' },
  { name: '75 James Condominiums', developer: 'Fengate, Liuna & Hi-Rise Group', city: 'Hamilton', area: 'James Street South', type: 'Condo', storeys: null, units: 616, price_from: 500000, status: 'Coming Soon', completion: '2026' },
  { name: 'Beasley Park Lofts', developer: 'Stinson Properties', city: 'Hamilton', area: 'Beasley', type: 'Condo', storeys: null, units: null, price_from: 299900, status: 'Selling', completion: 'TBD' },
  // ── BURLINGTON ───────────────────────────────────────────────────
  { name: 'North Shore Condos', developer: 'National Homes', city: 'Burlington', area: 'Plains Road Corridor', type: 'Condo', storeys: null, units: null, price_from: 755000, status: 'Selling', completion: 'TBD' },
  { name: 'Nautique Penthouse Collection', developer: 'Adi Development Group', city: 'Burlington', area: 'Downtown Burlington', type: 'Condo', storeys: null, units: null, price_from: 600000, status: 'Selling', completion: 'TBD' },
  { name: 'Illumina Condos', developer: 'Molinaro Group', city: 'Burlington', area: 'Downtown Burlington', type: 'Condo', storeys: null, units: null, price_from: 760000, status: 'Selling', completion: 'TBD' },
  { name: '1989 Condos', developer: 'Latch Developments', city: 'Burlington', area: 'Appleby', type: 'Condo', storeys: null, units: null, price_from: null, status: 'Selling', completion: '2028' },
  { name: 'BeauSoleil Condos', developer: 'Carriage Gate Homes', city: 'Burlington', area: 'Lakeshore', type: 'Condo', storeys: null, units: null, price_from: 400000, status: 'Coming Soon', completion: 'TBD' },
  // ── MILTON ───────────────────────────────────────────────────────
  { name: 'Stationside Condos', developer: 'Neatt Communities', city: 'Milton', area: 'Downtown Milton', type: 'Condo', storeys: 23, units: 613, price_from: 487990, status: 'Selling', completion: '2027' },
  { name: 'The Millhouse Condos', developer: 'Fernbrook Homes', city: 'Milton', area: 'Downtown Milton', type: 'Condo', storeys: 19, units: 677, price_from: null, status: 'Selling', completion: 'TBD' },
  { name: 'Elements Condos & Towns', developer: 'Trinity Point (Greenpark)', city: 'Milton', area: 'Bronte & Britannia', type: 'Mixed', storeys: null, units: 373, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Thompson Towers', developer: 'Greenpark Group', city: 'Milton', area: 'South Milton', type: 'Mixed', storeys: null, units: null, price_from: 603900, status: 'Selling', completion: 'TBD' },
  { name: 'Creekside Condos', developer: 'Sutherland & York Trafalgar', city: 'Milton', area: 'Milton East', type: 'Condo', storeys: 6, units: 276, price_from: 580800, status: 'Selling', completion: '2025' },
  { name: 'Orianna Glen', developer: 'Argo Development Corp', city: 'Milton', area: 'West Milton', type: 'Townhome', storeys: null, units: 1202, price_from: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Panorama Milton', developer: 'Royalpark Homes', city: 'Milton', area: 'Northwest Milton', type: 'Townhome', storeys: null, units: 105, price_from: 999990, status: 'Selling', completion: '2025' },
  // ── HALTON HILLS ─────────────────────────────────────────────────
  { name: 'Juniper Gate', developer: 'Remington Homes', city: 'Halton Hills', area: 'Georgetown', type: 'Townhome', storeys: null, units: null, price_from: 899990, status: 'Selling', completion: '2026' },
  { name: 'Hello Georgetown', developer: 'Various', city: 'Halton Hills', area: 'Georgetown', type: 'Townhome', storeys: null, units: null, price_from: null, status: 'Selling', completion: 'TBD' },
];

export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    // Check if projects already exist
    const { count } = await supabase
      .from('precon_projects')
      .select('*', { count: 'exact', head: true });

    if (count > 0) {
      return NextResponse.json({ error: `Database already has ${count} projects. Delete them first if you want to re-seed.` }, { status: 409 });
    }

    // Insert all projects with sort_order based on array position
    const projectsWithOrder = SEED_PROJECTS.map((p, i) => ({
      ...p,
      sort_order: i,
      image_url: null,
      featured: false,
    }));

    const { data, error } = await supabase
      .from('precon_projects')
      .insert(projectsWithOrder)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, count: data.length });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Seed failed' }, { status: 500 });
  }
}
