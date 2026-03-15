'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/listings', label: 'Listings' },
  { href: '/market-pulse', label: 'Market Pulse' },
  { href: '/neighbourhoods', label: 'Neighbourhoods' },
  { href: '/news', label: 'News' },
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
      {/* RECO Compliance Bar */}
      <div className="bg-navy text-white/70 text-[10px] py-1 px-4 text-center font-mono">
        Hamza Nouman, Sales Representative · Royal LePage Signature Realty, Brokerage · Licensed by RECO
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 no-underline">
              <span className="font-heading font-bold text-xl text-navy tracking-tight">
                MississaugaInvestor
              </span>
              <span className="font-heading font-bold text-xl text-accent">.ca</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                    pathname === item.href || pathname?.startsWith(item.href + '/')
                      ? 'text-accent bg-accent/5'
                      : 'text-muted hover:text-navy hover:bg-cloud'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/saved"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline relative ${
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
            <div className="hidden md:flex items-center gap-2">
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
                    className="btn-primary text-sm !px-4 !py-2 no-underline"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-muted hover:bg-cloud transition-colors"
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
          <div className="md:hidden border-t border-gray-100 bg-white animate-slideDown">
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
