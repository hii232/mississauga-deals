import AskHamzaForm from '@/components/lead-gen/ask-hamza-form';

export const metadata = {
  title: 'Get Hamza\u2019s Honest Take on Any Listing \u2014 Free 24hr Deal Analysis',
  description:
    'Paste any MLS link. Hamza will send you a 1-page honest investor analysis within 24 hours \u2014 real cash flow, red flags, stress test, and buy/skip verdict. Free. No pitch.',
  alternates: { canonical: '/ask-hamza' },
  openGraph: {
    title: 'Get Hamza\u2019s Honest Take on Any Listing \u2014 Free 24hr Deal Analysis',
    description:
      'Paste any MLS link. Get a 1-page investor analysis in 24 hours. Real cash flow, red flags, stress test, buy/skip verdict. Free.',
    url: 'https://www.mississaugainvestor.ca/ask-hamza',
  },
};

export default function AskHamzaPage({ searchParams }) {
  const prefillNote = searchParams?.addr
    ? `I'm interested in the listing at ${searchParams.addr}${searchParams.id ? ' (Listing #' + searchParams.id + ')' : ''}.`
    : '';
  const prefillUrl = searchParams?.mls || (searchParams?.id ? `https://www.mississaugainvestor.ca/listings/${searchParams.id}` : '');
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-accent/20 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/15 border border-accent/30 rounded-full px-3 py-1 mb-5">
            <span className="text-accent text-xs font-bold uppercase tracking-wider">Free \u00b7 24-Hour Turnaround</span>
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-5xl text-white leading-tight mb-5">
            Found a deal? <span className="text-accent">Get my honest take.</span>
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Paste any Mississauga, Oakville, Milton, Burlington, or GTA MLS link. I\u2019ll personally review it and send you a 1-page investor breakdown within 24 hours.
          </p>
          <p className="text-white/50 text-sm mt-3">
            Real cash flow. Real expenses. Stress test. Red flags. Buy-or-skip verdict.
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: '\ud83d\udcca',
              title: 'Realistic cash flow',
              body: 'Not the flattering calculator number. Real maintenance, real insurance, real vacancy, and rate-reset stress test.',
            },
            {
              icon: '\ud83d\udea9',
              title: 'Every red flag',
              body: 'Zoning, legal suite feasibility, tenant status, DOM signals, price history, comparable sold risk.',
            },
            {
              icon: '\u2705',
              title: 'Buy or skip verdict',
              body: 'A clear yes or no with the math behind it. If I\u2019d walk, I\u2019ll tell you exactly why.',
            },
          ].map((x) => (
            <div key={x.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">{x.icon}</div>
              <h3 className="font-heading font-bold text-navy text-sm mb-1.5">{x.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{x.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        <AskHamzaForm prefillUrl={prefillUrl} prefillNote={prefillNote} source={prefillUrl ? 'deal-analysis-listing' : 'ask-hamza'} />
      </section>

      {/* Why free */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-cloud rounded-2xl p-6 md:p-8">
          <h2 className="font-heading font-bold text-navy text-xl mb-3">Why is this free?</h2>
          <p className="text-sm text-muted leading-relaxed mb-3">
            Because if the numbers work, you\u2019ll probably want someone to represent you on the offer. That\u2019s me. If the numbers don\u2019t work \u2014 I\u2019ll tell you honestly and we both saved time.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            I do this for a handful of serious investors every week. No spam. No mailing list. Just a real one-page PDF in your inbox within 24 hours.
          </p>
          <div className="mt-5 pt-5 border-t border-white/60 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              HN
            </div>
            <div>
              <p className="font-heading font-bold text-navy text-sm">Hamza Nouman</p>
              <p className="text-xs text-muted">REALTOR\u00AE \u00b7 Cityscape Real Estate Ltd. \u00b7 Licensed by RECO</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
