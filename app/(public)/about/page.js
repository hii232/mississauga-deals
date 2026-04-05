import Link from 'next/link';
import { PersonJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata = {
  title: 'About Hamza Nouman — Mississauga Real Estate Investment Specialist',
  description:
    'Hamza Nouman is a licensed Sales Representative with Cityscape Real Estate Ltd. in Mississauga, Ontario. Specializing in investment properties, cash flow analysis, and data-driven real estate decisions. Creator of MississaugaInvestor.ca.',
  keywords: [
    'Hamza Nouman',
    'Hamza Nouman Mississauga',
    'Hamza Nouman real estate',
    'Hamza Nouman Cityscape Real Estate',
    'Mississauga real estate agent',
    'Mississauga investment specialist',
    'MississaugaInvestor.ca',
    'Cityscape Real Estate Ltd.',
    'Mississauga realtor',
    'real estate investor Mississauga',
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Hamza Nouman — Mississauga Real Estate Investment Specialist',
    description:
      'Licensed Sales Representative with Cityscape Real Estate Ltd.. Specializing in Mississauga investment properties and data-driven real estate analysis.',
    url: 'https://www.mississaugainvestor.ca/about',
    type: 'profile',
    profile: {
      firstName: 'Hamza',
      lastName: 'Nouman',
      username: 'homeswithhamza',
    },
    images: [
      {
        url: '/images/hamza-headshot.jpg',
        width: 800,
        height: 800,
        alt: 'Hamza Nouman — Mississauga Real Estate Investment Specialist',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Hamza Nouman — Mississauga Real Estate Investment Specialist',
    description:
      'Licensed Sales Representative with Cityscape Real Estate Ltd.. Creator of MississaugaInvestor.ca.',
    images: ['/images/hamza-headshot.jpg'],
  },
};

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', url: 'https://www.mississaugainvestor.ca' },
    { name: 'About Hamza Nouman', url: 'https://www.mississaugainvestor.ca/about' },
  ];

  return (
    <>
      <PersonJsonLd />
      <BreadcrumbJsonLd items={breadcrumbs} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-accent/20 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-shrink-0">
              <img
                src="/images/hamza-headshot.jpg"
                alt="Hamza Nouman — Mississauga Real Estate Investment Specialist at Cityscape Real Estate Ltd."
                className="w-48 h-48 md:w-64 md:h-64 rounded-2xl object-cover object-top shadow-2xl border-2 border-white/10"
                width={256}
                height={256}
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-3">
                Hamza Nouman
              </h1>
              <p className="text-accent font-semibold text-lg mb-1">
                Sales Representative
              </p>
              <p className="text-white/60 text-sm mb-4">
                Cityscape Real Estate Ltd., Brokerage | Licensed by RECO
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href="tel:+16476091289"
                  className="inline-flex items-center gap-2 bg-accent text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-accent/90 transition no-underline"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  647-609-1289
                </a>
                <a
                  href="mailto:hamza@nouman.ca"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition no-underline"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  hamza@nouman.ca
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="bg-cloud border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-navy">1,800+</p>
              <p className="text-xs text-muted">Properties Analyzed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">24</p>
              <p className="text-xs text-muted">Neighbourhoods Covered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-500">5.0 &#9733;</p>
              <p className="text-xs text-muted">Google Rating (28 Reviews)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-navy">Since 2020</p>
              <p className="text-xs text-muted">Licensed REALTOR&reg;</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Content */}
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="prose prose-navy max-w-none">
          <h2 className="font-heading text-2xl font-bold text-navy mb-4">
            About Hamza Nouman
          </h2>
          <p className="text-navy/80 leading-relaxed mb-6">
            Hamza Nouman is a licensed real estate Sales Representative with{' '}
            <a href="https://www.cityscaperealestate.ca" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
              Cityscape Real Estate Ltd., Brokerage
            </a>{' '}
            in Mississauga, Ontario. He specializes in helping investors find, analyze, and acquire
            income-producing properties across the Greater Toronto Area, with a primary focus on
            Mississauga and the Peel Region.
          </p>

          <p className="text-navy/80 leading-relaxed mb-6">
            Hamza built{' '}
            <Link href="/" className="text-accent hover:text-accent/80">
              MississaugaInvestor.ca
            </Link>{' '}
            — a data-driven investment property platform that scores every active MLS listing for
            cash flow, cap rate, and overall investment potential. The platform analyzes over 1,800
            properties across 24 Mississauga neighbourhoods, giving investors a quantitative edge
            in identifying the best opportunities.
          </p>

          <h2 className="font-heading text-2xl font-bold text-navy mb-4 mt-10">
            Investment Specializations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              { title: 'Cash Flow Analysis', desc: 'Detailed mortgage breakdowns, expense modelling, and net cash flow projections for every listing.' },
              { title: 'Buy-and-Hold Rentals', desc: 'Identifying condos, townhomes, and detached homes near transit with strong rental demand.' },
              { title: 'BRRR Strategy', desc: 'Buy, Renovate, Rent, Refinance strategies for building equity through value-add properties.' },
              { title: 'Pre-Construction Investing', desc: 'VIP access to pre-construction projects with long-term appreciation potential.' },
              { title: 'Multi-Unit Conversions', desc: 'Analyzing properties for legal secondary suite and multi-unit conversion potential.' },
              { title: 'Data-Driven Deal Scoring', desc: 'Proprietary Deal Score algorithm that evaluates properties on 10+ investment metrics.' },
            ].map((spec) => (
              <div key={spec.title} className="bg-cloud rounded-xl p-5 border border-gray-100">
                <h3 className="font-heading font-semibold text-sm text-navy mb-1">{spec.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{spec.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="font-heading text-2xl font-bold text-navy mb-4 mt-10">
            Service Areas
          </h2>
          <p className="text-navy/80 leading-relaxed mb-4">
            Hamza Nouman serves real estate investors across Mississauga and the surrounding regions,
            including:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
            {[
              'Port Credit', 'Lakeview', 'Clarkson', 'Lorne Park', 'Erin Mills',
              'Streetsville', 'Churchill Meadows', 'Meadowvale', 'Cooksville',
              'City Centre', 'Malton', 'Hurontario Corridor', 'Square One District',
              'Oakville', 'Burlington', 'Brampton', 'Milton', 'Toronto',
            ].map((area) => (
              <div key={area} className="flex items-center gap-2 text-sm text-navy/70">
                <span className="text-accent">&#10003;</span> {area}
              </div>
            ))}
          </div>

          <h2 className="font-heading text-2xl font-bold text-navy mb-4 mt-10">
            Professional Background
          </h2>
          <p className="text-navy/80 leading-relaxed mb-4">
            Licensed since 2020 with the Real Estate Council of Ontario (RECO), Hamza Nouman operates
            under Cityscape Real Estate Ltd., Brokerage — one of Canada's most trusted real estate
            brands. He holds a background in technology and data analytics, which he leverages to build
            tools like MississaugaInvestor.ca that give his clients a competitive advantage in the market.
          </p>
          <p className="text-navy/80 leading-relaxed mb-6">
            His analytical mindset and commitment to data-driven decision
            making set him apart in the real estate industry.
          </p>

          <h2 className="font-heading text-2xl font-bold text-navy mb-4 mt-10">
            Contact Hamza Nouman
          </h2>
          <div className="bg-navy rounded-2xl p-8 text-center">
            <p className="text-white/70 text-sm mb-6">
              Whether you are looking for your first rental property or building a portfolio, Hamza
              provides market expertise and analytical tools to help you invest with confidence.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/50 text-xs mb-1">Phone</p>
                <a href="tel:+16476091289" className="text-white font-semibold no-underline hover:text-accent transition">
                  647-609-1289
                </a>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/50 text-xs mb-1">Email</p>
                <a href="mailto:hamza@nouman.ca" className="text-white font-semibold no-underline hover:text-accent transition">
                  hamza@nouman.ca
                </a>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/50 text-xs mb-1">Office</p>
                <p className="text-white font-semibold">885 Plymouth Dr UNIT 2, Mississauga</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/16476091289?text=Hi%20Hamza%2C%20I%27m%20interested%20in%20investing%20in%20Mississauga%20real%20estate"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary !px-8 no-underline"
              >
                WhatsApp Hamza
              </a>
              <Link href="/quiz" className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-8 no-underline">
                Take the Deal Quiz
              </Link>
            </div>
          </div>

          {/* Online Profiles */}
          <h2 className="font-heading text-2xl font-bold text-navy mb-4 mt-10">
            Find Hamza Nouman Online
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Cityscape Real Estate', url: 'https://www.cityscaperealestate.ca/', icon: '🏠' },
              { label: 'REALTOR.ca Profile', url: 'https://www.realtor.ca/agent/2100010/hamza-nouman-201-30-eglinton-ave-west-mississauga-ontario-l5r3e7', icon: '🏡' },
              { label: 'HamzaHomes.ca', url: 'https://www.hamzahomes.ca/', icon: '🌐' },
              { label: 'LinkedIn', url: 'https://www.linkedin.com/in/homeswithhamza/', icon: '💼' },
              { label: 'Facebook', url: 'https://www.facebook.com/Homeswithhamza/', icon: '📘' },
              { label: 'HomeFinder.ca', url: 'https://www.homefinder.ca/agents/494937-hamza-nouman', icon: '🔍' },
            ].map((profile) => (
              <a
                key={profile.label}
                href={profile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-accent/20 hover:bg-cloud transition no-underline group"
              >
                <span className="text-xl">{profile.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-navy group-hover:text-accent transition">{profile.label}</p>
                  <p className="text-[10px] text-muted truncate max-w-[250px]">{profile.url.replace('https://', '').replace('www.', '')}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
