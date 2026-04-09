'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AdminContext = createContext(null);
export function useAdmin() {
  return useContext(AdminContext);
}

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/leads', label: 'Leads', icon: '👥' },
  { href: '/admin/precon', label: 'Pre-Con', icon: '🏗️' },
  { href: '/admin/blog', label: 'Blog', icon: '📝' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
];

export default function AdminLayout({ children }) {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Check sessionStorage on mount
  useEffect(() => {
    const key = sessionStorage.getItem('mi_admin_key');
    if (key) {
      setAdminKey(key);
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        headers: { 'x-admin-key': password },
      });
      if (res.ok) {
        sessionStorage.setItem('mi_admin_key', password);
        setAdminKey(password);
        setAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('mi_admin_key');
    setAdminKey('');
    setAuthenticated(false);
    setPassword('');
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="bg-[#141B2D] border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-5 shadow-lg shadow-accent/20">
              MI
            </div>
            <h1 className="font-heading text-xl font-bold text-white mb-1">Admin Dashboard</h1>
            <p className="text-sm text-white/40 mb-6">mississaugainvestor.ca</p>

            {error && (
              <p className="text-red-400 text-sm mb-4 bg-red-400/10 rounded-lg py-2 px-3">{error}</p>
            )}

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm text-center tracking-wider placeholder:text-white/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 mb-3"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Authenticated — show admin shell
  return (
    <AdminContext.Provider value={{ adminKey }}>
      <div className="min-h-screen bg-[#0B1120] flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-[#141B2D] border-r border-white/[0.06] flex flex-col transition-transform lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Brand */}
          <div className="px-5 py-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-accent to-accent-dark rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                MI
              </div>
              <div>
                <p className="text-sm font-bold text-white">MI Admin</p>
                <p className="text-[10px] text-white/30">mississaugainvestor.ca</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                    active
                      ? 'bg-accent/10 text-accent border border-accent/20'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-green-400/70 bg-green-400/[0.04] border border-green-400/10 hover:bg-green-400/[0.08] transition-colors no-underline"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              View Live Site
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400/70 hover:bg-red-400/[0.06] transition-colors w-full"
            >
              <span>🚪</span> Log Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar (mobile) */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#141B2D]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white/60 hover:text-white p-1"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-bold text-white">MI Admin</span>
            <div className="w-6" />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
