import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MississaugaInvestor.ca — Mississauga Real Estate Investment Deals';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
          background: 'linear-gradient(135deg, #0F2A4A 0%, #1a3a5c 50%, #0F2A4A 100%)',
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
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '52px', fontWeight: 800, color: '#ffffff' }}>
              MississaugaInvestor
            </span>
            <span style={{ fontSize: '52px', fontWeight: 800, color: '#10b981' }}>
              .ca
            </span>
          </div>

          <div
            style={{
              fontSize: '26px',
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '40px',
              maxWidth: '800px',
            }}
          >
            Every active listing scored for cash flow, cap rate, and investment potential
          </div>

          <div
            style={{
              display: 'flex',
              gap: '30px',
              marginBottom: '40px',
            }}
          >
            {[
              { label: 'Active Listings', value: '1,800+' },
              { label: 'Sale-to-List', value: '96%' },
              { label: 'Avg DOM', value: '36 days' },
              { label: 'Inventory', value: '5.2 mo' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px 24px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '16px',
              color: '#64748b',
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
