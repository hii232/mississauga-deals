'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Floating Contact Button (site-wide) ──
export function FloatingContactButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-all hover:bg-accent-dark hover:scale-105 active:scale-95"
        aria-label="Contact Hamza"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Contact Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-72 rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-navy px-5 py-4">
            <h3 className="font-heading font-semibold text-white text-sm">
              Talk to Hamza
            </h3>
            <p className="text-white/60 text-xs mt-0.5">
              Licensed Sales Representative
            </p>
          </div>

          {/* Options */}
          <div className="p-4 space-y-2">
            <a
              href="tel:+16476095615"
              className="flex items-center gap-3 rounded-lg bg-cloud px-4 py-3 text-sm font-medium text-navy hover:bg-accent/5 transition-colors no-underline"
            >
              <svg className="h-5 w-5 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <div>
                <p className="font-semibold">Call Now</p>
                <p className="text-xs text-muted">(647) 609-5615</p>
              </div>
            </a>

            <a
              href="https://wa.me/16476095615?text=Hi%20Hamza%2C%20I%27m%20interested%20in%20Mississauga%20investment%20properties"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-cloud px-4 py-3 text-sm font-medium text-navy hover:bg-accent/5 transition-colors no-underline"
            >
              <svg className="h-5 w-5 text-success flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <div>
                <p className="font-semibold">WhatsApp</p>
                <p className="text-xs text-muted">Quick response</p>
              </div>
            </a>

            <a
              href="mailto:hamza@mississaugainvestor.ca?subject=Investment%20Inquiry%20-%20MississaugaInvestor.ca"
              className="flex items-center gap-3 rounded-lg bg-cloud px-4 py-3 text-sm font-medium text-navy hover:bg-accent/5 transition-colors no-underline"
            >
              <svg className="h-5 w-5 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-xs text-muted">hamza@mississaugainvestor.ca</p>
              </div>
            </a>

            <Link
              href="/quiz"
              className="flex items-center gap-3 rounded-lg bg-accent/5 border border-accent/20 px-4 py-3 text-sm font-medium text-accent hover:bg-accent/10 transition-colors no-underline"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              <div>
                <p className="font-semibold">Find My Deal Strategy</p>
                <p className="text-xs text-muted">2-min quiz</p>
              </div>
            </Link>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-cloud/50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center">
              Royal LePage Signature Realty · Licensed by RECO
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ── Inline Contact Bar (for detail pages) ──
export function ContactBar({ address }) {
  const msg = address
    ? `Hi Hamza, I'm interested in ${address}`
    : "Hi Hamza, I'm interested in Mississauga investment properties";

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white text-sm font-bold">
          HN
        </div>
        <div>
          <p className="text-sm font-semibold text-navy">Interested in this property?</p>
          <p className="text-xs text-muted">Hamza Nouman · Sales Representative</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <a
          href="tel:+16476095615"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-xs font-semibold text-white hover:bg-accent-dark transition-colors no-underline"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          Call
        </a>
        <a
          href={`https://wa.me/16476095615?text=${encodeURIComponent(msg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-xs font-semibold text-white hover:bg-[#20bd5a] transition-colors no-underline"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </a>
        <a
          href={`mailto:hamza@mississaugainvestor.ca?subject=${encodeURIComponent(`Inquiry: ${address || 'Investment Property'}`)}&body=${encodeURIComponent(msg)}`}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-navy py-2.5 text-xs font-semibold text-white hover:bg-navy/90 transition-colors no-underline"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          Email
        </a>
      </div>
    </div>
  );
}
