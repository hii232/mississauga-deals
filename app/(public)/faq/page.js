'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FAQJsonLd } from '@/components/seo/json-ld';

const FAQ_DATA = [
  {
    category: 'About the Platform',
    items: [
      {
        question: 'What is MississaugaInvestor.ca?',
        answer:
          'MississaugaInvestor.ca is a data-driven real estate investment platform focused on Mississauga. Every active listing is automatically scored for cash flow, cap rate, and overall investment potential using our proprietary Deal Score algorithm. We help investors quickly identify the best opportunities without spending hours crunching numbers.',
      },
      {
        question: 'Is MississaugaInvestor.ca free to use?',
        answer:
          'Yes! Browsing listings, viewing deal scores, and using our market tools are completely free. Just sign up with your email to unlock full property analysis, cash flow breakdowns, and neighbourhood insights.',
      },
      {
        question: 'How often is the listing data updated?',
        answer:
          'Our data is pulled directly from the MLS and updated every 24 hours. Deal scores, cash flow estimates, and market metrics are recalculated with each update to ensure you always have the latest information.',
      },
    ],
  },
  {
    category: 'Deal Scores & Analysis',
    items: [
      {
        question: 'How is the Deal Score calculated?',
        answer:
          'The Deal Score (1-10) evaluates each property across multiple investment metrics including estimated monthly cash flow, cap rate, price-to-rent ratio, and days on market. A higher score indicates stronger estimated investment returns at the current asking price. The score is NOT a measure of property quality — it measures return potential.',
      },
      {
        question: 'What does the cash flow estimate include?',
        answer:
          'Our cash flow estimate assumes a standard 20% down payment with a 25-year amortization at current interest rates. We subtract estimated mortgage payments, property taxes, insurance, maintenance reserves (5%), and vacancy allowance (4%) from estimated rental income based on comparable rents in the area.',
      },
      {
        question: 'Should I buy a property based solely on the Deal Score?',
        answer:
          'No. The Deal Score is a starting point for research, not a substitute for due diligence. Actual returns depend on property condition, tenant quality, future rate changes, renovation costs, and many other factors not captured in our algorithm. Always consult a financial advisor and conduct your own inspections before purchasing.',
      },
    ],
  },
  {
    category: 'Working with Hamza',
    items: [
      {
        question: 'Who is Hamza Nouman?',
        answer:
          'Hamza Nouman is a licensed Sales Representative with Royal LePage Signature Realty, Brokerage. He specializes in helping investors find, analyze, and acquire income-producing properties in Mississauga. He built MississaugaInvestor.ca to give his clients a data-driven edge in the market.',
      },
      {
        question: 'How do I get in touch?',
        answer:
          'You can reach Hamza by phone at (647) 609-5615, by WhatsApp for quick responses, or by email. Use the floating chat button on any page to see all contact options. You can also take the "Find My Deal" quiz to get matched with properties that fit your investment strategy.',
      },
      {
        question: 'Do I have to use Hamza as my agent?',
        answer:
          'Not at all. The platform is free for everyone to use. However, if you want expert guidance on Mississauga investment properties, hands-on deal analysis, or help negotiating and closing, Hamza is here to help as your licensed representative.',
      },
    ],
  },
  {
    category: 'Investment Strategy',
    items: [
      {
        question: 'What investment strategies work best in Mississauga?',
        answer:
          'Mississauga offers opportunities across several strategies: Buy-and-hold rentals (condos and townhomes near transit), BRRR (Buy, Renovate, Rent, Refinance) with older detached homes, pre-construction investing for long-term appreciation, and multi-unit conversions. The best strategy depends on your capital, risk tolerance, and timeline.',
      },
      {
        question: 'What is a good cap rate for Mississauga?',
        answer:
          'In the current Mississauga market, cap rates typically range from 3% to 6% depending on property type and neighbourhood. Condos tend toward the lower end, while multi-unit properties can hit 5-6%. While these rates are lower than some markets, Mississauga offers strong appreciation potential and tenant demand near Toronto.',
      },
      {
        question: 'Is Mississauga a good place to invest in real estate?',
        answer:
          'Mississauga is one of Canada\'s fastest-growing cities with strong fundamentals: proximity to Toronto, growing transit infrastructure (Hurontario LRT), diverse economy, top-ranked schools, and consistent population growth. These factors support both rental demand and long-term property value appreciation.',
      },
    ],
  },
];

const allItems = FAQ_DATA.flatMap((cat) => cat.items);

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <FAQJsonLd items={allItems} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-accent/20 py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto">
            Everything you need to know about investing in Mississauga real estate with MississaugaInvestor.ca
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {FAQ_DATA.map((category, catIdx) => {
          const globalOffset = FAQ_DATA.slice(0, catIdx).reduce((s, c) => s + c.items.length, 0);

          return (
            <div key={category.category} className="mb-10 last:mb-0">
              <h2 className="font-heading text-lg font-bold text-navy mb-4 flex items-center gap-2">
                <span className="h-1 w-6 bg-accent rounded-full" />
                {category.category}
              </h2>

              <div className="space-y-2">
                {category.items.map((item, itemIdx) => {
                  const globalIdx = globalOffset + itemIdx;
                  const isOpen = openIndex === globalIdx;

                  return (
                    <div
                      key={globalIdx}
                      className="border border-gray-100 rounded-xl overflow-hidden transition-colors hover:border-accent/20"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                      >
                        <span className="text-sm font-semibold text-navy pr-4">
                          {item.question}
                        </span>
                        <svg
                          className={`h-5 w-5 text-accent flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 animate-slideUp">
                          <p className="text-sm text-muted leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-navy to-accent/20 rounded-2xl p-8 text-center">
          <h3 className="font-heading text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-white/60 text-sm mb-6">
            Hamza is happy to chat about your investment goals — no pressure, no obligation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/16476091289?text=Hi%20Hamza%2C%20I%20have%20a%20question%20about%20investing%20in%20Mississauga"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary !px-6 no-underline text-center"
            >
              WhatsApp Hamza
            </a>
            <Link href="/quiz" className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !px-6 no-underline text-center">
              Take the Deal Quiz
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
