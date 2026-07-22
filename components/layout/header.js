'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/* ============================================================
   NAV STRUCTURE
   - Mississauga Deals  → /listings        (single tab, no dropdown)
   - GTA Deals ▾        → /gta             (mega-menu grouped by region)
   - Pre-Con            → /pre-construction/projects
   - Resources ▾        → /guides, /market-pulse, /neighbourhoods, /recent-sales, /score-methodology
   - Blog               → /blog
   - About Hamza        → /about
   ============================================================ */

const GTA_GROUPS = [
  {
    region: 'Halton',
    cities: ['Oakville', 'Burlington', 'Milton', 'Halton Hills', 'Georgetown'],
  },
  {
    region: 'Peel',
    cities: ['Brampton', 'Caledon'],
  },
  {
    region: 'York',
    cities: ['Vaughan', 'Richmond Hill', 'Markham', 'Aurora', 'Newmarket', 'King'],
  },
  {
    region: 'Durham',
    cities: ['Pickering', 'Ajax', 'Whitby', 'Oshawa', 'Clarington'],
  },
  {
    region: 'Toronto',
    cities: ['Toronto (All)', 'Etobicoke', 'North York', 'Scarborough', 'East York', 'York'],
  },
  {
    region: 'Hamilton + West',
    cities: ['Hamilton', 'Stoney Creek', 'Dundas', 'Ancaster'],
  },
];

function cityHref(city) {
  if (city === 'Toronto (All)') return '/gta?city=Toronto';
  return `/gta?city=${encodeURIComponent(city)}`;
}

const NAV_ITEMS = [
  { href: '/listings', label: 'Mississauga Deals' },
  { label: 'GTA Deals', mega: true, href: '/gta' },
  { href: '/pre-construction/projects', label: 'Pre-Con' },
  {
    label: 'Resources',
    children: [
      { href: '/guides', label: 'Investor Guides' },
      { href: '/market-pulse', label: 'Market Pulse' },
      { href: '/neighbourhoods', label: 'Neighbourhoods' },
      { href: '/recent-sales', label: 'Recent Sales' },
      { href: '/score-methodology', label: 'Deal Score Method' },
    ],
  },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About Hamza' },
];

/* ------------------------------------------------------------
   GTA MEGA-MENU (desktop)
   Hover + click + keyboard. 6 regions × up to 6 cities.
   ------------------------------------------------------------ */
function GtaMegaMenu({ pathname }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const triggerRef = useRef(null);

  const isActive =
    pathname === '/gta' || pathname?.startsWith('/gta/');

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function handleLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onKeyDown={(e) => {
        // Escape closes from anywhere inside the menu, not just the trigger
        if (e.key === 'Escape' && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        // Close when keyboard focus leaves the menu entirely
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-expanded={open}
        aria-haspopup="true"
        className={`px-3 xl:px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
          isActive
            ? 'text-accent bg-accent/10'
            : 'text-navy hover:text-accent hover:bg-accent/5'
        }`}
      >
        GTA Deals
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            d="M3 5L6 8L9 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-50"
          role="menu"
        >
          <div className="w-[720px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slideDown">
            {/* top banner link */}
            <Link
              href="/gta"
              className="block px-6 py-4 bg-gradient-to-r from-navy to-accent text-white no-underline hover:opacity-95 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-heading font-bold text-base">
                    Browse All GTA Deals
                  </div>
                  <div className="text-[11px] text-white/70 mt-0.5">
                    Every active scored listing across the Greater Toronto Area
                  </div>
                </div>
                <span className="text-white/80 text-sm">→</span>
              </div>
            </Link>

            {/* 3-column region grid */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 p-6">
              {GTA_GROUPS.map((group) => (
                <div key={group.region}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                    {group.region}
                  </div>
                  <ul className="space-y-1">
                    {group.cities.map((city) => (
                      <li key={city}>
                        <Link
                          href={cityHref(city)}
                          className="block text-sm text-navy hover:text-accent no-underline transition-colors py-0.5"
                        >
                          {city}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* footer CTA row */}
            <div className="border-t border-gray-100 px-6 py-3 bg-cloud flex items-center justify-between text-xs">
              <span className="text-muted">
                Don&apos;t see your city? <span className="text-navy font-semibold">Search every GTA municipality</span>
              </span>
              <Link
                href="/quiz"
                className="text-accent font-bold no-underline hover:text-accent-dark"
              >
                Find My Deal →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------
   SIMPLE DROPDOWN (for Market Data)
   ------------------------------------------------------------ */
function SimpleDropdown({ item, pathname }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const isActive = item.children?.some(
    (c) => pathname === c.href || pathname?.startsWith(c.href + '/')
  );

  function handleEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function handleLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`px-3 xl:px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
          isActive
            ? 'text-accent bg-accent/10'
            : 'text-navy hover:text-accent hover:bg-accent/5'
        }`}
      >
        {item.label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            d="M3 5L6 8L9 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 pt-1 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[220px] animate-slideDown">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`block px-4 py-2.5 text-sm no-underline transition-colors ${
                  pathname === child.href ||
                  pathname?.startsWith(child.href + '/')
                    ? 'text-accent bg-accent/5 font-semibold'
                    : 'text-navy hover:bg-cloud hover:text-accent'
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header({ savedCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const registered = localStorage.getItem('user_registered');
    const email = localStorage.getItem('user_email');
    if (registered === 'true' && email) {
      setUserEmail(email);
    }
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem('user_registered');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    setUserEmail(null);
    router.push('/');
  }

  return (
    <>
      {/* HST Rebate Announcement Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-xs sm:text-sm py-2 px-4 text-center font-semibold">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="hidden sm:inline">🔥</span>
          <span>
            NEW: Save Up to $130,000 on New Homes — Ontario HST Rebate Now Active
          </span>
          <span className="hidden md:inline text-white/80 text-xs font-normal">
            (Apr 1, 2026 – Mar 31, 2027)
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/pre-construction/hst-rebate"
              className="inline-flex items-center rounded-full bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold text-white no-underline transition-colors"
            >
              Learn More
            </Link>
            <Link
              href="/book-call"
              className="hidden sm:inline-flex items-center rounded-full bg-white text-orange-600 px-3 py-1.5 text-xs font-bold no-underline hover:bg-white/90 transition-colors"
            >
              Book a Call
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="bg-navy text-white text-[11px] sm:text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
            <span className="text-white/60 font-mono hidden md:inline">
              Hamza Nouman, REALTOR® · Cityscape Real Estate Ltd., Brokerage ·
              Licensed by RECO
            </span>
            <span className="text-white/60 font-mono md:hidden">
              Hamza Nouman, REALTOR®
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1l2.39 6.13H19l-5.3 4.1L15.78 18 10 14.27 4.22 18l2.08-6.77L1 7.13h6.61z" />
              </svg>
              5.0
              <span className="text-white/50 font-normal hidden sm:inline">
                (28 reviews)
              </span>
            </span>
            <a
              href="tel:+16476091289"
              className="text-white hover:text-accent font-semibold no-underline flex items-center gap-1 transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="text-green-400"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              647-609-1289
            </a>
            <Link
              href="/book-call"
              className="hidden sm:inline-flex items-center rounded-full bg-accent hover:bg-accent-dark text-white px-3 py-0.5 text-xs font-bold no-underline transition-colors"
            >
              Book Free Call →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-0.5 no-underline flex-shrink-0"
            >
              <span className="font-heading font-bold text-xl text-navy tracking-tight">
                MississaugaInvestor
              </span>
              <span className="font-heading font-bold text-xl text-accent">
                .ca
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1 mx-6">
              {NAV_ITEMS.map((item) => {
                if (item.mega) {
                  return (
                    <GtaMegaMenu key={item.label} pathname={pathname} />
                  );
                }
                if (item.children) {
                  return (
                    <SimpleDropdown
                      key={item.label}
                      item={item}
                      pathname={pathname}
                    />
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 xl:px-4 py-2 rounded-lg text-sm font-semibold transition-colors no-underline whitespace-nowrap ${
                      pathname === item.href ||
                      pathname?.startsWith(item.href + '/')
                        ? 'text-accent bg-accent/10'
                        : 'text-navy hover:text-accent hover:bg-accent/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              <Link
                href="/saved"
                className={`relative p-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                  pathname === '/saved'
                    ? 'text-accent bg-accent/5'
                    : 'text-muted hover:text-navy hover:bg-cloud'
                }`}
                title="Saved Properties"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3-5 3V4z" />
                </svg>
                {savedCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {savedCount}
                  </span>
                )}
              </Link>

              <Link
                href="/quiz"
                className="bg-accent hover:bg-accent-dark text-white text-sm font-bold px-5 py-2.5 rounded-lg no-underline transition-colors shadow-sm shadow-accent/25"
              >
                Find My Deal
              </Link>

              {userEmail ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:bg-cloud transition-colors">
                    <div className="w-7 h-7 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
                      {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-50">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[180px]">
                      <div className="px-4 py-2 text-xs text-muted truncate border-b border-gray-50">{userEmail}</div>
                      <Link href="/saved" className="block px-4 py-2.5 text-sm text-navy hover:bg-cloud no-underline">
                        Saved Properties {savedCount > 0 && `(${savedCount})`}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-muted hover:bg-cloud hover:text-navy transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-muted hover:text-navy no-underline transition-colors">
                    Log In
                  </Link>
                  <Link href="/signup" className="btn-primary text-sm !px-5 !py-2 no-underline">
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: Phone + Menu */}
            <div className="flex lg:hidden items-center gap-2">
              <a href="tel:+16476091289" className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" aria-label="Call Hamza">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
              </a>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-muted hover:bg-cloud transition-colors"
                aria-label="Toggle menu"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  {menuOpen ? (
                    <path d="M6 6l12 12M6 18L18 6" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white animate-slideDown max-h-[80vh] overflow-y-auto">
            <nav className="px-4 py-3 space-y-1">
              {/* Find My Deal — top of mobile menu */}
              <Link
                href="/quiz"
                className="block w-full text-center bg-accent hover:bg-accent-dark text-white font-bold text-sm rounded-lg py-3 no-underline transition-colors mb-3"
              >
                Find My Deal →
              </Link>

              {NAV_ITEMS.map((item) => {
                if (item.mega) {
                  // GTA mega-menu → accordion grouped by region
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-navy hover:bg-cloud transition-colors"
                      >
                        {item.label}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${mobileExpanded === item.label ? 'rotate-180' : ''}`}>
                          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {mobileExpanded === item.label && (
                        <div className="pl-3 space-y-3 mt-1 pb-2">
                          <Link
                            href="/gta"
                            className="block px-3 py-2 rounded-lg text-sm font-semibold text-accent bg-accent/5 no-underline"
                          >
                            Browse All GTA Deals →
                          </Link>
                          {GTA_GROUPS.map((group) => (
                            <div key={group.region}>
                              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                                {group.region}
                              </div>
                              <div className="space-y-0.5">
                                {group.cities.map((city) => (
                                  <Link
                                    key={city}
                                    href={cityHref(city)}
                                    className="block px-3 py-1.5 rounded-lg text-sm text-navy hover:bg-cloud hover:text-accent no-underline"
                                  >
                                    {city}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                if (item.children) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-navy hover:bg-cloud transition-colors"
                      >
                        {item.label}
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${mobileExpanded === item.label ? 'rotate-180' : ''}`}>
                          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {mobileExpanded === item.label && (
                        <div className="pl-4 space-y-0.5 mt-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`block px-3 py-2 rounded-lg text-sm no-underline ${
                                pathname === child.href ? 'text-accent bg-accent/5 font-medium' : 'text-muted hover:text-navy hover:bg-cloud'
                              }`}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium no-underline ${
                      pathname === item.href ? 'text-accent bg-accent/5' : 'text-navy hover:bg-cloud'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/saved"
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy hover:bg-cloud no-underline"
              >
                Saved {savedCount > 0 && `(${savedCount})`}
              </Link>

              {/* Mobile auth */}
              <div className="border-t border-gray-100 pt-3 mt-3 flex gap-2">
                {userEmail ? (
                  <>
                    <span className="text-xs text-muted truncate flex-1 self-center">{userEmail}</span>
                    <button onClick={handleLogout} className="btn-secondary text-sm">
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-secondary text-sm flex-1 text-center no-underline">
                      Log In
                    </Link>
                    <Link href="/signup" className="btn-primary text-sm flex-1 text-center no-underline">
                      Sign Up Free
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
