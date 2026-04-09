'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  GTA Pre-Construction Project Data – organized by city / area      */
/* ------------------------------------------------------------------ */

const PROJECTS = [
  // ── MISSISSAUGA ──────────────────────────────────────────────────
  // City Centre / Square One
  { name: 'M6 Condos (M City)', developer: 'Rogers Real Estate & Urban Capital', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 57, units: 900, priceFrom: 440900, status: 'Selling', completion: '2028' },
  { name: 'Stak36', developer: 'Daniels Corporation & Oxford Properties', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 45, units: null, priceFrom: 625900, status: 'Selling', completion: 'TBD' },
  { name: 'Exchange District Phase 3', developer: 'Camrost Felcorp', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 66, units: 660, priceFrom: null, status: 'Selling', completion: '2026' },
  { name: 'Above Condos', developer: 'Marlin Spring & RioCan Living', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 24, units: 579, priceFrom: 598990, status: 'Selling', completion: 'TBD' },
  { name: 'Tempo Condos', developer: 'Greenpark Group', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: 40, units: 2086, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Aspire Condominiums', developer: 'The Conservatory Group', city: 'Mississauga', area: 'City Centre', type: 'Condo', storeys: null, units: null, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },
  // Hurontario Corridor
  { name: 'Canopy Towers 2', developer: 'Liberty Development Corp', city: 'Mississauga', area: 'Hurontario Corridor', type: 'Condo', storeys: 38, units: 522, priceFrom: 476900, status: 'Selling', completion: '2027' },
  { name: 'Gemma Condos', developer: 'Pinnacle International', city: 'Mississauga', area: 'Hurontario Corridor', type: 'Condo', storeys: 35, units: 406, priceFrom: 750900, status: 'Selling', completion: '2026' },
  { name: 'ORO at Edge Towers', developer: 'Solmar Development Corp', city: 'Mississauga', area: 'Hurontario Corridor', type: 'Condo', storeys: 50, units: 630, priceFrom: 705900, status: 'Selling', completion: '2027' },
  // Lakeview / Port Credit
  { name: 'Bridge House at Brightwater', developer: 'Kilmer, DiamondCorp, Dream & FRAM+Slokker', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Condo', storeys: 19, units: null, priceFrom: 649900, status: 'Selling', completion: '2028' },
  { name: 'Exhale Condos', developer: 'Brixen Developments', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Condo', storeys: 11, units: null, priceFrom: 659900, status: 'Selling', completion: '2026' },
  { name: 'Aquanova Condos', developer: 'Greenpark Group', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Condo', storeys: 43, units: null, priceFrom: null, status: 'Coming Soon', completion: '2029' },
  { name: 'Birch Condos & Towns', developer: 'Branthaven Homes', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Mixed', storeys: null, units: null, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Pier House Towns', developer: 'Branthaven Homes', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Townhome', storeys: null, units: null, priceFrom: 799990, status: 'Selling', completion: 'TBD' },
  { name: 'Aura Townhomes', developer: 'Caivan Communities', city: 'Mississauga', area: 'Lakeview / Port Credit', type: 'Townhome', storeys: null, units: null, priceFrom: 500000, status: 'Selling', completion: 'TBD' },
  // Cooksville
  { name: 'Kith Condos', developer: 'Daniels Corporation', city: 'Mississauga', area: 'Cooksville', type: 'Condo', storeys: null, units: null, priceFrom: 525900, status: 'Selling', completion: 'TBD' },
  // Streetsville
  { name: 'Vic Condominiums', developer: 'Forest Green Homes', city: 'Mississauga', area: 'Streetsville', type: 'Condo', storeys: 15, units: 238, priceFrom: 631900, status: 'Selling', completion: '2026' },
  { name: 'Reine Condos', developer: 'Lamb Development Corp', city: 'Mississauga', area: 'Streetsville', type: 'Condo', storeys: 9, units: 390, priceFrom: 465900, status: 'Selling', completion: '2027' },
  // Erin Mills / West
  { name: 'High Line Condos', developer: 'Branthaven Homes', city: 'Mississauga', area: 'Erin Mills', type: 'Condo', storeys: null, units: null, priceFrom: 599900, status: 'Selling', completion: 'TBD' },
  { name: 'The Nine', developer: 'Mattamy Homes', city: 'Mississauga', area: 'Erin Mills', type: 'Townhome', storeys: null, units: null, priceFrom: 916990, status: 'Selling', completion: 'TBD' },
  { name: 'Whitehorn Woods', developer: 'National Homes', city: 'Mississauga', area: 'Erin Mills', type: 'Townhome', storeys: null, units: null, priceFrom: 1177990, status: 'Selling', completion: 'TBD' },

  // ── TORONTO ──────────────────────────────────────────────────────
  { name: 'Birchley Park', developer: 'Diamond Kilmer Developments', city: 'Toronto', area: 'Scarborough', type: 'Condo', storeys: null, units: null, priceFrom: 531900, status: 'Selling', completion: 'TBD' },
  { name: 'Motto Condos', developer: 'Sierra Communities', city: 'Toronto', area: 'West End', type: 'Condo', storeys: null, units: null, priceFrom: 489900, status: 'Selling', completion: 'TBD' },
  { name: 'Celeste Condominiums', developer: 'Alterra & DiamondCorp', city: 'Toronto', area: 'Downtown', type: 'Condo', storeys: null, units: null, priceFrom: 773990, status: 'Selling', completion: 'TBD' },
  { name: 'Untitled Toronto', developer: 'Westdale & Reserve Properties', city: 'Toronto', area: 'Midtown', type: 'Condo', storeys: null, units: null, priceFrom: 606900, status: 'Selling', completion: 'TBD' },
  { name: '123 Portland', developer: 'Minto Communities', city: 'Toronto', area: 'King West', type: 'Condo', storeys: null, units: null, priceFrom: 651900, status: 'Selling', completion: 'TBD' },
  { name: 'BLVD.Q', developer: 'Mattamy Homes Canada', city: 'Toronto', area: 'Etobicoke', type: 'Condo', storeys: null, units: null, priceFrom: 456855, status: 'Selling', completion: 'TBD' },
  { name: 'The Wilde Condos', developer: 'Chestnut Hill Developments', city: 'Toronto', area: 'North York', type: 'Condo', storeys: null, units: null, priceFrom: 559900, status: 'Selling', completion: 'TBD' },
  { name: 'The Main Tower II', developer: 'Marlin Spring & Trolleybus', city: 'Toronto', area: 'East York', type: 'Condo', storeys: null, units: null, priceFrom: 580990, status: 'Selling', completion: 'TBD' },
  { name: 'Keeley Condos', developer: 'TAS', city: 'Toronto', area: 'Junction', type: 'Condo', storeys: null, units: null, priceFrom: 399000, status: 'Selling', completion: 'TBD' },
  { name: '8 Temple Condos', developer: 'Curated Properties', city: 'Toronto', area: 'East End', type: 'Condo', storeys: null, units: null, priceFrom: 714900, status: 'Selling', completion: 'TBD' },

  // ── BRAMPTON ─────────────────────────────────────────────────────
  { name: 'Daniels MPV 2', developer: 'Daniels Corporation', city: 'Brampton', area: 'Mount Pleasant', type: 'Condo', storeys: null, units: null, priceFrom: 479900, status: 'Selling', completion: 'TBD' },
  { name: 'Duo Condos Phase 2', developer: 'National Homes & Brixen', city: 'Brampton', area: 'Downtown Brampton', type: 'Condo', storeys: null, units: null, priceFrom: 400000, status: 'Selling', completion: 'TBD' },
  { name: 'UPtowns at Heart Lake', developer: 'Vandyk Properties', city: 'Brampton', area: 'Heart Lake', type: 'Mixed', storeys: null, units: null, priceFrom: null, status: 'Selling', completion: 'TBD' },
  { name: 'Stella 2 Condos', developer: 'i2 Developments', city: 'Brampton', area: 'Downtown Brampton', type: 'Condo', storeys: null, units: null, priceFrom: 655000, status: 'Coming Soon', completion: '2026' },
  { name: 'Bristol Place', developer: 'Solmar Development Corp', city: 'Brampton', area: 'Downtown Brampton', type: 'Condo', storeys: null, units: null, priceFrom: 500000, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Bramalea Square Condos', developer: 'Essence Homes', city: 'Brampton', area: 'Bramalea', type: 'Condo', storeys: null, units: null, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },

  // ── VAUGHAN ──────────────────────────────────────────────────────
  { name: 'SXSW Condos', developer: 'Primont Homes', city: 'Vaughan', area: 'Vaughan Metropolitan Centre', type: 'Condo', storeys: null, units: null, priceFrom: 646900, status: 'Selling', completion: 'TBD' },
  { name: 'Bravo Condos', developer: 'Menkes & QuadReal', city: 'Vaughan', area: 'Vaughan Metropolitan Centre', type: 'Condo', storeys: null, units: null, priceFrom: null, status: 'Selling', completion: 'TBD' },
  { name: 'Artwalk Condos', developer: 'SmartCentres', city: 'Vaughan', area: 'Vaughan Metropolitan Centre', type: 'Condo', storeys: null, units: null, priceFrom: 600000, status: 'Coming Soon', completion: 'TBD' },
  { name: 'CG Tower Condos', developer: 'Cortel Group', city: 'Vaughan', area: 'Concord', type: 'Condo', storeys: null, units: null, priceFrom: 847500, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Grand Festival Condos', developer: 'Menkes Development', city: 'Vaughan', area: 'Vaughan Metropolitan Centre', type: 'Condo', storeys: null, units: null, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'V City Condos', developer: 'Liberty Development Corp', city: 'Vaughan', area: 'Concord', type: 'Condo', storeys: null, units: null, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },

  // ── OAKVILLE ─────────────────────────────────────────────────────
  { name: 'Soleil Condos', developer: 'Mattamy Homes', city: 'Oakville', area: 'Dundas Corridor', type: 'Condo', storeys: null, units: null, priceFrom: 545000, status: 'Selling', completion: 'TBD' },
  { name: 'North Oak (Oakvillage)', developer: 'Minto Communities', city: 'Oakville', area: 'Trafalgar', type: 'Condo', storeys: null, units: null, priceFrom: 661900, status: 'Selling', completion: 'TBD' },
  { name: 'Distrikt Trailside 2.0', developer: 'Distrikt Developments', city: 'Oakville', area: 'Dundas Corridor', type: 'Condo', storeys: null, units: null, priceFrom: 659900, status: 'Selling', completion: 'TBD' },
  { name: 'The Branch Condos', developer: 'Zancor Homes', city: 'Oakville', area: 'Bronte', type: 'Condo', storeys: null, units: null, priceFrom: 878900, status: 'Selling', completion: 'TBD' },
  { name: 'Oak and Co Condos', developer: 'Cortel Group', city: 'Oakville', area: 'Dundas Corridor', type: 'Condo', storeys: null, units: null, priceFrom: 918800, status: 'Selling', completion: 'TBD' },
  { name: 'Gemini South Tower', developer: 'Castleridge Homes', city: 'Oakville', area: 'Bronte', type: 'Condo', storeys: null, units: null, priceFrom: 756000, status: 'Selling', completion: 'TBD' },
  { name: 'NAVA Townhomes', developer: 'Digreen Homes', city: 'Oakville', area: 'West Oakville', type: 'Townhome', storeys: null, units: null, priceFrom: 900000, status: 'Selling', completion: 'TBD' },

  // ── MARKHAM ──────────────────────────────────────────────────────
  { name: 'Pangea Condos', developer: 'Times Group Corporation', city: 'Markham', area: 'Highway 7 Corridor', type: 'Condo', storeys: null, units: null, priceFrom: 629000, status: 'Selling', completion: 'TBD' },
  { name: 'Uptown Markham', developer: 'Times Group Corporation', city: 'Markham', area: 'Highway 7 Corridor', type: 'Condo', storeys: null, units: null, priceFrom: null, status: 'Selling', completion: 'TBD' },
  { name: 'Royal Bayview Condos', developer: 'Tridel', city: 'Markham', area: 'Bayview & Royal Orchard', type: 'Condo', storeys: null, units: null, priceFrom: 1600000, status: 'Selling', completion: 'TBD' },
  { name: 'Gallery Towers', developer: 'The Remington Group', city: 'Markham', area: 'Downtown Markham', type: 'Condo', storeys: null, units: null, priceFrom: 600000, status: 'Coming Soon', completion: 'TBD' },
  { name: 'UnionCity Condos', developer: 'Metropia', city: 'Markham', area: 'Downtown Markham', type: 'Condo', storeys: null, units: null, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },

  // ── RICHMOND HILL ────────────────────────────────────────────────
  { name: 'The Towns on Bayview', developer: 'Primont Homes', city: 'Richmond Hill', area: 'Bayview Corridor', type: 'Townhome', storeys: null, units: null, priceFrom: 1700000, status: 'Selling', completion: 'TBD' },
  { name: 'Observatory Hill', developer: 'The Conservatory Group', city: 'Richmond Hill', area: 'North Richmond Hill', type: 'Townhome', storeys: null, units: null, priceFrom: 2700000, status: 'Selling', completion: 'TBD' },
  { name: 'Uplands of Swan Lake', developer: 'Caliber Homes', city: 'Richmond Hill', area: 'Swan Lake', type: 'Townhome', storeys: null, units: null, priceFrom: 1400000, status: 'Selling', completion: 'TBD' },
  { name: 'Jefferson Heights', developer: 'Grand Grace Development', city: 'Richmond Hill', area: 'Jefferson', type: 'Townhome', storeys: null, units: null, priceFrom: 990000, status: 'Coming Soon', completion: 'TBD' },

  // ── HAMILTON ──────────────────────────────────────────────────────
  { name: 'Westgate on Main', developer: 'Matrix Development Group', city: 'Hamilton', area: 'Downtown Hamilton', type: 'Condo', storeys: null, units: null, priceFrom: 485900, status: 'Selling', completion: 'TBD' },
  { name: 'APEX Condos', developer: 'Coletara Development', city: 'Hamilton', area: 'Downtown Hamilton', type: 'Condo', storeys: null, units: null, priceFrom: 430000, status: 'Selling', completion: 'TBD' },
  { name: 'The Design District', developer: 'Emblem Developments', city: 'Hamilton', area: 'Downtown Hamilton', type: 'Condo', storeys: null, units: null, priceFrom: 400000, status: 'Selling', completion: 'TBD' },
  { name: 'Television City Condos', developer: 'Lamb Development Corp', city: 'Hamilton', area: 'Downtown Hamilton', type: 'Condo', storeys: null, units: null, priceFrom: 909600, status: 'Selling', completion: 'TBD' },
  { name: '75 James Condominiums', developer: 'Fengate, Liuna & Hi-Rise Group', city: 'Hamilton', area: 'James Street South', type: 'Condo', storeys: null, units: 616, priceFrom: 500000, status: 'Coming Soon', completion: '2026' },
  { name: 'Beasley Park Lofts', developer: 'Stinson Properties', city: 'Hamilton', area: 'Beasley', type: 'Condo', storeys: null, units: null, priceFrom: 299900, status: 'Selling', completion: 'TBD' },

  // ── BURLINGTON ───────────────────────────────────────────────────
  { name: 'North Shore Condos', developer: 'National Homes', city: 'Burlington', area: 'Plains Road Corridor', type: 'Condo', storeys: null, units: null, priceFrom: 755000, status: 'Selling', completion: 'TBD' },
  { name: 'Nautique Penthouse Collection', developer: 'Adi Development Group', city: 'Burlington', area: 'Downtown Burlington', type: 'Condo', storeys: null, units: null, priceFrom: 600000, status: 'Selling', completion: 'TBD' },
  { name: 'Illumina Condos', developer: 'Molinaro Group', city: 'Burlington', area: 'Downtown Burlington', type: 'Condo', storeys: null, units: null, priceFrom: 760000, status: 'Selling', completion: 'TBD' },
  { name: '1989 Condos', developer: 'Latch Developments', city: 'Burlington', area: 'Appleby', type: 'Condo', storeys: null, units: null, priceFrom: null, status: 'Selling', completion: '2028' },
  { name: 'BeauSoleil Condos', developer: 'Carriage Gate Homes', city: 'Burlington', area: 'Lakeshore', type: 'Condo', storeys: null, units: null, priceFrom: 400000, status: 'Coming Soon', completion: 'TBD' },

  // ── MILTON ───────────────────────────────────────────────────────
  { name: 'Stationside Condos', developer: 'Neatt Communities', city: 'Milton', area: 'Downtown Milton', type: 'Condo', storeys: 23, units: 613, priceFrom: 487990, status: 'Selling', completion: '2027' },
  { name: 'The Millhouse Condos', developer: 'Fernbrook Homes', city: 'Milton', area: 'Downtown Milton', type: 'Condo', storeys: 19, units: 677, priceFrom: null, status: 'Selling', completion: 'TBD' },
  { name: 'Elements Condos & Towns', developer: 'Trinity Point (Greenpark)', city: 'Milton', area: 'Bronte & Britannia', type: 'Mixed', storeys: null, units: 373, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Thompson Towers', developer: 'Greenpark Group', city: 'Milton', area: 'South Milton', type: 'Mixed', storeys: null, units: null, priceFrom: 603900, status: 'Selling', completion: 'TBD' },
  { name: 'Creekside Condos', developer: 'Sutherland & York Trafalgar', city: 'Milton', area: 'Milton East', type: 'Condo', storeys: 6, units: 276, priceFrom: 580800, status: 'Selling', completion: '2025' },
  { name: 'Orianna Glen', developer: 'Argo Development Corp', city: 'Milton', area: 'West Milton', type: 'Townhome', storeys: null, units: 1202, priceFrom: null, status: 'Coming Soon', completion: 'TBD' },
  { name: 'Panorama Milton', developer: 'Royalpark Homes', city: 'Milton', area: 'Northwest Milton', type: 'Townhome', storeys: null, units: 105, priceFrom: 999990, status: 'Selling', completion: '2025' },

  // ── HALTON HILLS ─────────────────────────────────────────────────
  { name: 'Juniper Gate', developer: 'Remington Homes', city: 'Halton Hills', area: 'Georgetown', type: 'Townhome', storeys: null, units: null, priceFrom: 899990, status: 'Selling', completion: '2026' },
  { name: 'Hello Georgetown', developer: 'Various', city: 'Halton Hills', area: 'Georgetown', type: 'Townhome', storeys: null, units: null, priceFrom: null, status: 'Selling', completion: 'TBD' },
];

/* ------------------------------------------------------------------ */
/*  City metadata — icons, colors, PSF range                          */
/* ------------------------------------------------------------------ */

const CITY_META = {
  'All Cities':      { emoji: '🏙️', color: 'bg-slate-100 text-slate-700', count: PROJECTS.length },
  'Mississauga':     { emoji: '🌆', color: 'bg-blue-100 text-blue-700' },
  'Toronto':         { emoji: '🏗️', color: 'bg-purple-100 text-purple-700' },
  'Brampton':        { emoji: '📈', color: 'bg-green-100 text-green-700' },
  'Vaughan':         { emoji: '🚇', color: 'bg-indigo-100 text-indigo-700' },
  'Oakville':        { emoji: '🌳', color: 'bg-emerald-100 text-emerald-700' },
  'Markham':         { emoji: '🏢', color: 'bg-sky-100 text-sky-700' },
  'Richmond Hill':   { emoji: '🏡', color: 'bg-rose-100 text-rose-700' },
  'Hamilton':        { emoji: '⚡', color: 'bg-amber-100 text-amber-700' },
  'Burlington':      { emoji: '🌊', color: 'bg-cyan-100 text-cyan-700' },
  'Milton':          { emoji: '🏔️', color: 'bg-lime-100 text-lime-700' },
  'Halton Hills':    { emoji: '🌿', color: 'bg-teal-100 text-teal-700' },
};

const TYPE_FILTERS = ['All', 'Condo', 'Townhome', 'Mixed'];

function formatPrice(p) {
  if (!p) return null;
  if (p >= 1000000) return `$${(p / 1000000).toFixed(1)}M`;
  return `$${Math.round(p / 1000)}K`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PreConstructionProjectsPage() {
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique cities
  const cities = ['All Cities', ...new Set(PROJECTS.map(p => p.city))];

  // Filter projects
  const filtered = useMemo(() => {
    return PROJECTS.filter(p => {
      if (selectedCity !== 'All Cities' && p.city !== selectedCity) return false;
      if (selectedType !== 'All' && p.type !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.developer.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCity, selectedType, searchQuery]);

  // Group by city then area
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      const key = `${p.city} — ${p.area}`;
      if (!map[p.city]) map[p.city] = {};
      if (!map[p.city][p.area]) map[p.city][p.area] = [];
      map[p.city][p.area].push(p);
    });
    return map;
  }, [filtered]);

  const cityOrder = ['Mississauga', 'Toronto', 'Brampton', 'Vaughan', 'Oakville', 'Markham', 'Richmond Hill', 'Hamilton', 'Burlington', 'Milton', 'Halton Hills'];

  return (
    <div className="min-h-screen bg-cloud">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-navy via-[#1e3a5f] to-[#0f1d30] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {PROJECTS.length}+ Active Projects Across the GTA
            </div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl leading-tight mb-4">
              GTA Pre-Construction<br />
              <span className="text-accent">Projects & Developments</span>
            </h1>
            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mb-8">
              Browse the latest pre-construction condos, townhomes, and developments across the Greater Toronto Area. Get VIP pricing and first access through Hamza Nouman.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pre-construction"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-dark transition no-underline"
              >
                Join VIP List
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link
                href="/pre-construction/hst-rebate"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 backdrop-blur text-white font-semibold text-sm hover:bg-white/20 transition no-underline"
              >
                HST Rebate Guide — Save $130K
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HST Banner ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy">Ontario HST Rebate — Save Up to $130,000 on New Builds</p>
            <p className="text-xs text-slate-600">APS signed between Apr 1, 2026 — Mar 31, 2027. This changes the investment math for every project below.</p>
          </div>
          <Link href="/pre-construction/hst-rebate" className="flex-shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 no-underline">
            Learn More &rarr;
          </Link>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
        {/* Search */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by project, developer, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm text-navy placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 bg-white"
            />
          </div>
        </div>

        {/* City filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {cities.map(city => {
            const meta = CITY_META[city] || {};
            const count = city === 'All Cities' ? PROJECTS.length : PROJECTS.filter(p => p.city === city).length;
            const isActive = selectedCity === city;
            return (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? 'bg-navy text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-navy/30 hover:text-navy'
                }`}
              >
                <span>{meta.emoji || '📍'}</span>
                {city}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-2">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                selectedType === t
                  ? 'bg-accent text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-accent'
              }`}
            >
              {t === 'All' ? 'All Types' : t}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted mt-3 mb-1">{filtered.length} project{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* ── Project Listings ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted">No projects match your filters.</p>
            <button onClick={() => { setSelectedCity('All Cities'); setSelectedType('All'); setSearchQuery(''); }} className="mt-3 text-accent text-sm font-medium hover:underline">
              Clear all filters
            </button>
          </div>
        )}

        {cityOrder.filter(c => grouped[c]).map(city => {
          const meta = CITY_META[city] || {};
          const areas = grouped[city];

          return (
            <div key={city} className="mb-10">
              {/* City Header */}
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
                <span className="text-2xl">{meta.emoji}</span>
                <h2 className="font-heading font-bold text-xl text-navy">{city}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.color || 'bg-slate-100 text-slate-600'}`}>
                  {Object.values(areas).flat().length} projects
                </span>
              </div>

              {/* Areas within city */}
              {Object.entries(areas).map(([area, projects]) => (
                <div key={area} className="mb-6">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3 ml-1">{area}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((p, i) => (
                      <div key={i} className="card p-5 hover:shadow-lg transition-shadow group">
                        {/* Status badge */}
                        <div className="flex items-start justify-between mb-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'Selling' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            p.type === 'Condo' ? 'bg-blue-50 text-blue-600' : p.type === 'Townhome' ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-600'
                          }`}>
                            {p.type}
                          </span>
                        </div>

                        {/* Project info */}
                        <h4 className="font-heading font-bold text-navy text-base mb-1 group-hover:text-accent transition-colors">{p.name}</h4>
                        <p className="text-xs text-muted mb-3">by {p.developer}</p>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                          {p.priceFrom && (
                            <div>
                              <span className="text-muted">From</span>
                              <p className="font-semibold text-navy">{formatPrice(p.priceFrom)}</p>
                            </div>
                          )}
                          {p.storeys && (
                            <div>
                              <span className="text-muted">Storeys</span>
                              <p className="font-semibold text-navy">{p.storeys}</p>
                            </div>
                          )}
                          {p.units && (
                            <div>
                              <span className="text-muted">Units</span>
                              <p className="font-semibold text-navy">{p.units.toLocaleString()}</p>
                            </div>
                          )}
                          {p.completion && p.completion !== 'TBD' && (
                            <div>
                              <span className="text-muted">Completion</span>
                              <p className="font-semibold text-navy">{p.completion}</p>
                            </div>
                          )}
                          {!p.priceFrom && !p.storeys && !p.units && (
                            <div className="col-span-2">
                              <span className="text-muted italic">Pricing & details coming soon</span>
                            </div>
                          )}
                        </div>

                        {/* CTA */}
                        <Link
                          href={`/pre-construction?project=${encodeURIComponent(p.name)}`}
                          className="block w-full text-center py-2 rounded-lg bg-navy/5 text-navy text-xs font-semibold hover:bg-accent hover:text-white transition no-underline"
                        >
                          Get VIP Pricing & Floor Plans
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="bg-navy text-white py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3">
            Want VIP Access to Any Project?
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xl mx-auto">
            Hamza gets you first access pricing, best unit selection, and full investment analysis on any pre-construction project across the GTA. No obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/pre-construction" className="btn-primary !px-8 !py-3 no-underline">
              Join the VIP List
            </Link>
            <a href="tel:6476091289" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition no-underline">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call Hamza — 647-609-1289
            </a>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-[10px] text-slate-400 leading-relaxed text-center">
          Prices, availability, and project details are subject to change without notice. Information is gathered from public sources and developer materials and may not reflect the most current data. All images and renderings are for illustrative purposes only. Please contact Hamza Nouman for the latest pricing, availability, and floor plans. Hamza Nouman, Salesperson, Cityscape Real Estate Ltd., Brokerage. Not intended to solicit buyers or sellers currently under contract.
        </p>
      </div>
    </div>
  );
}
