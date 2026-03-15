import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy text-white/80 mt-20">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-0.5 mb-3">
              <span className="font-heading font-bold text-lg text-white">MississaugaInvestor</span>
              <span className="font-heading font-bold text-lg text-accent">.ca</span>
            </div>
            <p className="text-white/50 text-xs leading-relaxed mb-4">
              Mississauga's investment property platform. Data-driven analysis for smart real estate decisions.
            </p>
            <div className="text-xs text-white/60 space-y-1">
              <p>Hamza Nouman, Sales Representative</p>
              <p>Royal LePage Signature Realty, Brokerage</p>
              <p>347 Peel Centre Dr., Brampton, ON</p>
              <p>
                <a href="tel:6476091289" className="text-accent hover:text-accent/80 no-underline">647-609-1289</a>
                {' · '}
                <a href="mailto:hamza@nouman.ca" className="text-accent hover:text-accent/80 no-underline">hamza@nouman.ca</a>
              </p>
              <p>
                <a href="https://www.hamzahomes.ca" target="_blank" rel="noreferrer" className="text-accent hover:text-accent/80 no-underline">
                  hamzahomes.ca
                </a>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/listings" className="text-white/50 hover:text-white no-underline transition-colors">Investment Listings</Link></li>
              <li><Link href="/market-pulse" className="text-white/50 hover:text-white no-underline transition-colors">Market Pulse</Link></li>
              <li><Link href="/neighbourhoods" className="text-white/50 hover:text-white no-underline transition-colors">Neighbourhoods</Link></li>
              <li><Link href="/quiz" className="text-white/50 hover:text-white no-underline transition-colors">Find My Deal</Link></li>
              <li><Link href="/pre-construction" className="text-white/50 hover:text-white no-underline transition-colors">Pre-Construction VIP</Link></li>
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3">Service Areas</h4>
            <ul className="space-y-2 text-xs text-white/50">
              <li>Port Credit · Lakeview</li>
              <li>Clarkson · Lorne Park</li>
              <li>Erin Mills · Streetsville</li>
              <li>Churchill Meadows</li>
              <li>Cooksville · City Centre</li>
              <li>Meadowvale · Malton</li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-3">Compliance</h4>
            <div className="space-y-3 text-xs">
              <a href="https://www.royallepage.ca" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/50 hover:text-white no-underline transition-colors">
                <span className="text-base">👑</span> Royal LePage
              </a>
              <a href="https://www.reco.on.ca" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/50 hover:text-white no-underline transition-colors">
                <span className="text-base">🏛️</span> Licensed by RECO
              </a>
              <a href="https://trreb.ca" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/50 hover:text-white no-underline transition-colors">
                <span className="text-base">📊</span> TRREB Member
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {/* TRREB Disclaimer */}
          <p className="text-[10px] text-white/30 leading-relaxed">
            The listing data is provided under copyright by the Toronto Regional Real Estate Board (TRREB).
            The listing data is deemed reliable but is not guaranteed accurate by TRREB. The trademarks
            REALTOR®, REALTORS®, and the REALTOR® logo are controlled by The Canadian Real Estate Association
            (CREA) and identify real estate professionals who are members of CREA. MLS®, Multiple Listing
            Service® and the associated logos are owned by CREA and identify the quality of services provided
            by real estate professionals who are members of CREA. Used under license.
          </p>

          {/* Investment Disclaimer */}
          <p className="text-[10px] text-white/30 leading-relaxed">
            Investment analysis tools are for general informational purposes only. Not financial, investment,
            or professional advice. All projections are estimates — actual results will differ. Consult qualified
            professionals before making investment decisions. Real estate investment involves significant risk
            including potential loss of capital.
          </p>

          {/* PIPEDA */}
          <p className="text-[10px] text-white/30 leading-relaxed">
            This website complies with PIPEDA (Personal Information Protection and Electronic Documents Act)
            and CASL (Canada's Anti-Spam Legislation). Your personal information is collected and used in
            accordance with our privacy policy.
          </p>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-white/5">
            <p className="text-[10px] text-white/25">
              © {new Date().getFullYear()} MississaugaInvestor.ca · Hamza Nouman · All rights reserved.
            </p>
            <div className="flex gap-4 text-[10px]">
              <Link href="/privacy" className="text-white/25 hover:text-white/50 no-underline transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-white/25 hover:text-white/50 no-underline transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
