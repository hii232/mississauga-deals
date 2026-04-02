import Link from 'next/link';
import Image from 'next/image';

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
              <p>Cityscape Real Estate Ltd., Brokerage</p>
              <p>885 Plymouth Dr UNIT 2, Mississauga, ON L5V 0B5</p>
              <p>
                <a href="tel:6476091289" className="text-accent hover:text-accent/80 no-underline">647-609-1289</a>
                {' · '}
                <a href="mailto:hamza@nouman.ca" className="text-accent hover:text-accent/80 no-underline">hamza@nouman.ca</a>
              </p>
              <p>
                <a href="https://www.mississaugainvestor.ca" className="text-accent hover:text-accent/80 no-underline">
                  mississaugainvestor.ca
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
              <li><Link href="/pre-construction/hst-rebate" className="text-white/50 hover:text-white no-underline transition-colors">HST Rebate Guide</Link></li>
              <li><Link href="/mortgage-calculator" className="text-white/50 hover:text-white no-underline transition-colors">Mortgage Calculator</Link></li>
              <li><Link href="/blog" className="text-white/50 hover:text-white no-underline transition-colors">Blog</Link></li>
              <li><Link href="/book-call" className="text-white/50 hover:text-white no-underline transition-colors">Book a Free Call</Link></li>
              <li><Link href="/about" className="text-white/50 hover:text-white no-underline transition-colors">About Hamza Nouman</Link></li>
              <li><Link href="/faq" className="text-white/50 hover:text-white no-underline transition-colors">FAQ</Link></li>
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
              <a href="https://www.cityscaperealestate.ca" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/50 hover:text-white no-underline transition-colors">
                <span className="text-base">🏢</span> Cityscape Real Estate Ltd., Brokerage
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
          {/* Bona Fide Interest Notice (PropTx VOW Datafeed Agreement Section 6.3(k)) */}
          <p className="text-[10px] text-white/30 leading-relaxed">
            The information provided herein must only be used by consumers that have a bona fide interest
            in the purchase, sale, or lease of real estate and may not be used for any commercial purpose
            or any other purpose.
          </p>

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
            Investment scores, cash flow estimates, cap rates, and all financial metrics displayed on this site
            are calculated estimates for informational purposes only. They are not appraisals, broker price opinions,
            or guaranteed returns. Actual investment performance depends on many factors not captured in these
            calculations including property condition, tenant quality, future interest rates, maintenance costs,
            and market conditions. Consult a qualified financial advisor before making investment decisions.
          </p>

          {/* Deal Score Disclaimer */}
          <p className="text-[10px] text-white/30 leading-relaxed">
            This score measures estimated investment return potential only — not property quality, condition,
            or desirability. Scores are based on mathematical calculations using list price, estimated rental
            income, and operating costs. A low investment score does not mean the property is undesirable — it
            means the current asking price relative to estimated rental income produces lower investor returns.
            Scores update as prices change. This is not an appraisal. Hamza Nouman, Sales Representative,
            Cityscape Real Estate Ltd., Brokerage.
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
