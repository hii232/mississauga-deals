'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/listings', label: 'Mississauga Deals', primary: true },
  { href: '/gta', label: 'GTA Deals', primary: true },
  { href: '/pre-construction/projects', label: 'Pre-Construction', primary: true },
  { href: '/recent-sales', label: 'Recent Sales' },
  { href: '/market-pulse', label: 'Market Pulse' },
  { href: '/neighbourhoods', label: 'Neighbourhoods' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About Hamza' },
  { href: '/quiz', label: 'Find My Deal' },
];

export default function Header({ savedCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
          <span>NEW: Save Up to $130,000 on New Homes — Ontario HST Rebate Now Active</span>
          <span className="hidden md:inline text-white/80 text-xs font-normal">(Apr 1, 2026 – Mar 31, 2027)</span>
          <div className="flex items-center gap-2">
            <Link href="/pre-construction/hst-rebate" className="inline-flex items-center rounded-full bg-white/20 hover:bg-white/30 px-3 py-0.5 text-xs font-bold text-white no-underline transition-colors">
              Learn More
            </Link>
            <Link href="/book-call" className="hidden sm:inline-flex items-center rounded-full bg-white text-orange-600 px-3 py-0.5 text-xs font-bold no-underline hover:bg-white/90 transition-colors">
              Book a Call
            </Link>
          </div>
        </div>
      </div>

      {/* RECO Compliance Bar */}
      <div className="bg-navy text-white/70 text-[10px] py-1 px-4 text-center font-mono">
        Hamza Nouman, REALTOR® · Cityscape Real Estate Ltd., Brokerage · Licensed by RECO
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 no-underline flex-shrink-0">
              <span className="font-heading font-bold text-xl text-navy tracking-tight">
                MississaugaInvestor
              </span>
              <span className="font-heading font-bold text-xl text-accent">.ca</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 flex-1 mx-6">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 xl:px-4 py-2 rounded-lg text-sm transition-colors no-underline whitespace-nowrap ${
                    item.primary
                      ? pathname === item.href || pathname?.startsWith(item.href + '/')
                        ? 'text-accent bg-accent/10 font-bold'
                        : 'text-navy font-bold hover:text-accent hover:bg-accent/5'
                      : pathname === item.href || pathname?.startsWith(item.href + '/')
                        ? 'text-accent bg-accent/5 font-medium'
                        : 'text-muted font-medium hover:text-navy hover:bg-cloud'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/saved"
                className={`px-3 xl:px-4 py-2 rounded-lg text-sm font-medium transition-colors no-underline relative whitespace-nowrap ${
                  pathname === '/saved' ? 'text-accent bg-accent/5' : 'text-muted hover:text-navy hover:bg-cloud'
                }`}
              >
                Saved
                {savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {savedCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {userEmail ? (
                <>
                  <span className="text-sm text-muted truncate max-w-[200px]" title={userEmail}>
                    {userEmail}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-ghost text-sm"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn-ghost text-sm no-underline"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-primary text-sm !px-5 !py-2 no-underline"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg text-muted hover:bg-cloud transition-colors"
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

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white animate-slideDown">
            <nav className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium no-underline ${
                    pathname === item.href
                      ? 'text-accent bg-accent/5'
                      : 'text-navy hover:bg-cloud'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/saved"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy hover:bg-cloud no-underline"
              >
                Saved {savedCount > 0 && `(${savedCount})`}
              </Link>
              <div className="border-t border-gray-100 pt-3 mt-3 flex gap-2">
                {userEmail ? (
                  <>
                    <span className="text-xs text-muted truncate flex-1 self-center">{userEmail}</span>
                    <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="btn-secondary text-sm">
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-secondary text-sm flex-1 text-center no-underline" onClick={() => setMenuOpen(false)}>
                      Log In
                    </Link>
                    <Link href="/signup" className="btn-primary text-sm flex-1 text-center no-underline" onClick={() => setMenuOpen(false)}>
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
