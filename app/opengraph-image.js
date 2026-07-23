import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MississaugaInvestor.ca — Mississauga Real Estate Investment Deals';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  // Brand "Mississauga dusk" palette (from tailwind.config.js): navy #1B2A4A,
  // accent #2563EB, gold #F59E0B, text-secondary #94A3B8, muted #64748B.
  // Evergreen capability chips only — no market stats that would silently go
  // stale on a static, un-refreshable social card (the brand's most-shared asset).
  const chips = [
    'Live MLS Listings',
    'Cash Flow & Cap Rate',
    'Investor Deal Scores',
    'Free Deal Alerts',
  ];
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #16223D 0%, #1B2A4A 55%, #25355C 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 60px',
          }}
        >
          {/* Wordmark — matches the site header/footer (white + accent-blue .ca) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            <span style={{ fontSize: '54px', fontWeight: 800, color: '#ffffff', letterSpacing: '-1px' }}>
              MississaugaInvestor
            </span>
            <span style={{ fontSize: '54px', fontWeight: 800, color: '#2563EB', letterSpacing: '-1px' }}>
              .ca
            </span>
          </div>

          {/* Gold accent underline for premium polish */}
          <div
            style={{
              display: 'flex',
              width: '120px',
              height: '5px',
              backgroundColor: '#F59E0B',
              borderRadius: '3px',
              marginTop: '18px',
              marginBottom: '26px',
            }}
          />

          <div
            style={{
              display: 'flex',
              fontSize: '27px',
              color: '#CBD5E1',
              textAlign: 'center',
              marginBottom: '42px',
              maxWidth: '840px',
              lineHeight: 1.3,
            }}
          >
            Every active Mississauga listing scored for cash flow, cap rate &amp; investment potential
          </div>

          <div
            style={{
              display: 'flex',
              gap: '18px',
              marginBottom: '44px',
            }}
          >
            {chips.map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 24px',
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: 'rgba(37,99,235,0.16)',
                  borderRadius: '999px',
                  border: '1px solid rgba(37,99,235,0.45)',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '18px',
              color: '#94A3B8',
            }}
          >
            <span>Hamza Nouman</span>
            <span>·</span>
            <span>Cityscape Real Estate Ltd.</span>
            <span>·</span>
            <span>Licensed by RECO</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
